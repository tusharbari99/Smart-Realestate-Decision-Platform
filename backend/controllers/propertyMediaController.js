const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../config/db");

const projectRoot = path.join(__dirname, "..");

const pendingRoot = path.join(
  projectRoot,
  "uploads",
  "property-media-pending",
);

const approvedRoot = path.join(
  projectRoot,
  "uploads",
  "properties",
);

fs.mkdirSync(pendingRoot, { recursive: true });
fs.mkdirSync(approvedRoot, { recursive: true });

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS property_videos (
      video_id INT NOT NULL AUTO_INCREMENT,
      property_id INT NOT NULL,
      video_url VARCHAR(500) NOT NULL,
      video_name VARCHAR(255) NULL,
      mime_type VARCHAR(100) NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (video_id),
      INDEX idx_property_video_property (property_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS property_media_requests (
      request_id INT NOT NULL AUTO_INCREMENT,
      property_id INT NOT NULL,
      seller_id INT NOT NULL,
      media_type VARCHAR(20) NOT NULL,
      pending_url VARCHAR(500) NOT NULL,
      approved_url VARCHAR(500) NULL,
      file_name VARCHAR(255) NULL,
      mime_type VARCHAR(100) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      PRIMARY KEY (request_id),
      INDEX idx_media_request_property (property_id),
      INDEX idx_media_request_seller (seller_id),
      INDEX idx_media_request_status (status)
    )
  `);
}

function getUserId(req) {
  const values = [
    req.user?.user_id,
    req.user?.userId,
    req.user?.id,
    req.user?.sub,
    req.userId,
    req.user_id,
  ];

  for (const value of values) {
    const number = Number(value);

    if (Number.isInteger(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

function safeFilename(originalName = "") {
  const extension = path.extname(originalName).toLowerCase();

  const name = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);

  return `${Date.now()}-${Math.round(
    Math.random() * 1000000000,
  )}-${name || "property-media"}${extension}`;
}

function urlToLocalPath(fileUrl) {
  if (!fileUrl?.startsWith("/uploads/")) {
    return null;
  }

  const relativePath = fileUrl.replace(/^\/+/, "");

  const resolvedPath = path.resolve(
    projectRoot,
    relativePath,
  );

  const uploadsRoot = path.resolve(
    projectRoot,
    "uploads",
  );

  if (!resolvedPath.startsWith(uploadsRoot)) {
    return null;
  }

  return resolvedPath;
}

async function deleteFile(fileUrl) {
  const filePath = urlToLocalPath(fileUrl);

  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch {
    // File may already be removed.
  }
}

async function moveFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), {
    recursive: true,
  });

  try {
    await fs.promises.rename(source, destination);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }

    await fs.promises.copyFile(source, destination);
    await fs.promises.unlink(source);
  }
}

async function removeRequestFiles(req) {
  const files = [
    ...(req.files?.images || []),
    ...(req.files?.videos || []),
  ];

  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.promises.unlink(file.path);
      } catch {
        // Ignore cleanup error.
      }
    }),
  );
}

async function sellerOwnsProperty(propertyId, sellerId) {
  const [rows] = await db.query(
    `
      SELECT property_id
      FROM properties
      WHERE property_id = ?
        AND seller_id = ?
      LIMIT 1
    `,
    [propertyId, sellerId],
  );

  return rows.length > 0;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const propertyId = Number(req.params.id);

    const destination = path.join(
      pendingRoot,
      String(propertyId || "unknown"),
    );

    fs.mkdirSync(destination, {
      recursive: true,
    });

    callback(null, destination);
  },

  filename(req, file, callback) {
    callback(null, safeFilename(file.originalname));
  },
});

const allowedImages = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const allowedVideos = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

const uploader = multer({
  storage,

  limits: {
    files: 13,
    fileSize: 120 * 1024 * 1024,
  },

  fileFilter(req, file, callback) {
    if (
      file.fieldname === "images" &&
      allowedImages.has(file.mimetype)
    ) {
      callback(null, true);
      return;
    }

    if (
      file.fieldname === "videos" &&
      allowedVideos.has(file.mimetype)
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "Unsupported file. Upload JPG, PNG, WebP, HEIC, MP4, MOV or WebM.",
      ),
    );
  },
});

exports.uploadFields = uploader.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 3 },
]);

exports.uploadMedia = async (req, res) => {
  try {
    await ensureTables();

    const propertyId = Number(req.params.id);
    const sellerId = getUserId(req);

    if (!propertyId || !sellerId) {
      await removeRequestFiles(req);

      return res.status(400).json({
        message: "Invalid property media request.",
      });
    }

    const ownsProperty = await sellerOwnsProperty(
      propertyId,
      sellerId,
    );

    if (!ownsProperty) {
      await removeRequestFiles(req);

      return res.status(403).json({
        message:
          "You can upload media only for your own property.",
      });
    }

    const images = req.files?.images || [];
    const videos = req.files?.videos || [];

    if (!images.length && !videos.length) {
      return res.status(400).json({
        message:
          "Select at least one property photo or video.",
      });
    }

    const [approvedImageRows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM property_images
        WHERE property_id = ?
      `,
      [propertyId],
    );

    const [pendingImageRows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM property_media_requests
        WHERE property_id = ?
          AND media_type = 'image'
          AND status = 'pending'
      `,
      [propertyId],
    );

    const [approvedVideoRows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM property_videos
        WHERE property_id = ?
      `,
      [propertyId],
    );

    const [pendingVideoRows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM property_media_requests
        WHERE property_id = ?
          AND media_type = 'video'
          AND status = 'pending'
      `,
      [propertyId],
    );

    const totalImages =
      Number(approvedImageRows[0]?.total || 0) +
      Number(pendingImageRows[0]?.total || 0) +
      images.length;

    const totalVideos =
      Number(approvedVideoRows[0]?.total || 0) +
      Number(pendingVideoRows[0]?.total || 0) +
      videos.length;

    if (totalImages > 10) {
      await removeRequestFiles(req);

      return res.status(400).json({
        message:
          "A property can contain a maximum of 10 photos including pending requests.",
      });
    }

    if (totalVideos > 3) {
      await removeRequestFiles(req);

      return res.status(400).json({
        message:
          "A property can contain a maximum of 3 videos including pending requests.",
      });
    }

    for (const file of images) {
      const pendingUrl =
        `/uploads/property-media-pending/${propertyId}/${file.filename}`;

      await db.query(
        `
          INSERT INTO property_media_requests (
            property_id,
            seller_id,
            media_type,
            pending_url,
            file_name,
            mime_type,
            status
          )
          VALUES (?, ?, 'image', ?, ?, ?, 'pending')
        `,
        [
          propertyId,
          sellerId,
          pendingUrl,
          file.originalname,
          file.mimetype,
        ],
      );
    }

    for (const file of videos) {
      const pendingUrl =
        `/uploads/property-media-pending/${propertyId}/${file.filename}`;

      await db.query(
        `
          INSERT INTO property_media_requests (
            property_id,
            seller_id,
            media_type,
            pending_url,
            file_name,
            mime_type,
            status
          )
          VALUES (?, ?, 'video', ?, ?, ?, 'pending')
        `,
        [
          propertyId,
          sellerId,
          pendingUrl,
          file.originalname,
          file.mimetype,
        ],
      );
    }

    return res.status(201).json({
      message:
        "Photos and videos were sent to the admin for review.",
      submitted: {
        images: images.length,
        videos: videos.length,
      },
    });
  } catch (error) {
    await removeRequestFiles(req);

    console.error("Media request upload error:", error);

    return res.status(500).json({
      message: "Could not submit property media.",
      error: error.message,
    });
  }
};

exports.getSellerMedia = async (req, res) => {
  try {
    await ensureTables();

    const propertyId = Number(req.params.id);
    const sellerId = getUserId(req);

    if (
      !propertyId ||
      !sellerId ||
      !(await sellerOwnsProperty(propertyId, sellerId))
    ) {
      return res.status(403).json({
        message: "Property media access denied.",
      });
    }

    const [images] = await db.query(
      `
        SELECT image_id, image_url, is_primary, uploaded_at
        FROM property_images
        WHERE property_id = ?
        ORDER BY is_primary DESC, uploaded_at DESC
      `,
      [propertyId],
    );

    const [videos] = await db.query(
      `
        SELECT
          video_id,
          video_url,
          video_name,
          mime_type,
          uploaded_at
        FROM property_videos
        WHERE property_id = ?
        ORDER BY uploaded_at DESC
      `,
      [propertyId],
    );

    const [requests] = await db.query(
      `
        SELECT
          request_id,
          media_type,
          pending_url AS media_url,
          file_name,
          mime_type,
          status,
          admin_note,
          created_at,
          reviewed_at
        FROM property_media_requests
        WHERE property_id = ?
          AND seller_id = ?
        ORDER BY created_at DESC
        LIMIT 40
      `,
      [propertyId, sellerId],
    );

    return res.json({
      images,
      videos,
      requests,
    });
  } catch (error) {
    console.error("Seller media load error:", error);

    return res.status(500).json({
      message: "Could not load property media.",
    });
  }
};

exports.getPublicMedia = async (req, res) => {
  try {
    await ensureTables();

    const propertyId = Number(req.params.id);

    const [propertyRows] = await db.query(
      `
        SELECT property_id
        FROM properties
        WHERE property_id = ?
          AND status = 'verified'
        LIMIT 1
      `,
      [propertyId],
    );

    if (!propertyRows.length) {
      return res.status(404).json({
        message: "Verified property not found.",
      });
    }

    const [images] = await db.query(
      `
        SELECT image_id, image_url, is_primary
        FROM property_images
        WHERE property_id = ?
        ORDER BY is_primary DESC, uploaded_at DESC
      `,
      [propertyId],
    );

    const [videos] = await db.query(
      `
        SELECT
          video_id,
          video_url,
          video_name,
          mime_type
        FROM property_videos
        WHERE property_id = ?
        ORDER BY uploaded_at DESC
      `,
      [propertyId],
    );

    return res.json({ images, videos });
  } catch (error) {
    console.error("Public media load error:", error);

    return res.status(500).json({
      message: "Could not load property media.",
    });
  }
};

exports.getAdminRequests = async (req, res) => {
  try {
    await ensureTables();

    const requestedStatus = String(
      req.query.status || "pending",
    ).toLowerCase();

    const status = [
      "pending",
      "approved",
      "rejected",
    ].includes(requestedStatus)
      ? requestedStatus
      : "pending";

    const [requests] = await db.query(
      `
        SELECT
          r.request_id,
          r.property_id,
          r.seller_id,
          r.media_type,
          r.pending_url,
          r.approved_url,
          r.file_name,
          r.mime_type,
          r.status,
          r.admin_note,
          r.created_at,
          r.reviewed_at,
          p.title AS property_title,
          p.address,
          p.city,
          u.name AS seller_name,
          u.email AS seller_email
        FROM property_media_requests r
        JOIN properties p
          ON p.property_id = r.property_id
        JOIN users u
          ON u.user_id = r.seller_id
        WHERE r.status = ?
        ORDER BY r.created_at ASC
      `,
      [status],
    );

    return res.json({ requests });
  } catch (error) {
    console.error("Admin media request error:", error);

    return res.status(500).json({
      message: "Could not load media requests.",
    });
  }
};

exports.reviewMediaRequest = async (req, res) => {
  try {
    await ensureTables();

    const requestId = Number(req.params.requestId);

    const action = String(
      req.body?.action || "",
    ).toLowerCase();

    const adminNote = String(
      req.body?.admin_note || "",
    ).trim();

    if (
      !requestId ||
      !["approve", "reject"].includes(action)
    ) {
      return res.status(400).json({
        message: "Invalid media review request.",
      });
    }

    const [rows] = await db.query(
      `
        SELECT *
        FROM property_media_requests
        WHERE request_id = ?
        LIMIT 1
      `,
      [requestId],
    );

    const request = rows[0];

    if (!request) {
      return res.status(404).json({
        message: "Media request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "This media request is already reviewed.",
      });
    }

    if (action === "reject") {
      await deleteFile(request.pending_url);

      await db.query(
        `
          UPDATE property_media_requests
          SET
            status = 'rejected',
            admin_note = ?,
            reviewed_at = NOW()
          WHERE request_id = ?
        `,
        [adminNote || null, requestId],
      );

      return res.json({
        message: "Property media request rejected.",
      });
    }

    const sourcePath = urlToLocalPath(
      request.pending_url,
    );

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return res.status(404).json({
        message: "Pending media file was not found.",
      });
    }

    const targetFilename = safeFilename(
      request.file_name ||
        path.basename(sourcePath),
    );

    const targetDirectory = path.join(
      approvedRoot,
      String(request.property_id),
    );

    const targetPath = path.join(
      targetDirectory,
      targetFilename,
    );

    await moveFile(sourcePath, targetPath);

    const approvedUrl =
      `/uploads/properties/${request.property_id}/${targetFilename}`;

    if (request.media_type === "image") {
      const [primaryRows] = await db.query(
        `
          SELECT COUNT(*) AS total
          FROM property_images
          WHERE property_id = ?
            AND is_primary = 1
        `,
        [request.property_id],
      );

      const isPrimary =
        Number(primaryRows[0]?.total || 0) === 0
          ? 1
          : 0;

      await db.query(
        `
          INSERT INTO property_images (
            property_id,
            image_url,
            is_primary
          )
          VALUES (?, ?, ?)
        `,
        [
          request.property_id,
          approvedUrl,
          isPrimary,
        ],
      );
    } else {
      await db.query(
        `
          INSERT INTO property_videos (
            property_id,
            video_url,
            video_name,
            mime_type
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          request.property_id,
          approvedUrl,
          request.file_name,
          request.mime_type,
        ],
      );
    }

    await db.query(
      `
        UPDATE property_media_requests
        SET
          status = 'approved',
          approved_url = ?,
          admin_note = ?,
          reviewed_at = NOW()
        WHERE request_id = ?
      `,
      [
        approvedUrl,
        adminNote || null,
        requestId,
      ],
    );

    return res.json({
      message:
        "Property media approved and published successfully.",
    });
  } catch (error) {
    console.error("Media approval error:", error);

    return res.status(500).json({
      message: "Could not review property media.",
      error: error.message,
    });
  }
};

exports.setPrimaryImage = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const sellerId = getUserId(req);

    if (
      !propertyId ||
      !imageId ||
      !sellerId ||
      !(await sellerOwnsProperty(propertyId, sellerId))
    ) {
      return res.status(403).json({
        message: "Image access denied.",
      });
    }

    await db.query(
      `
        UPDATE property_images
        SET is_primary = 0
        WHERE property_id = ?
      `,
      [propertyId],
    );

    await db.query(
      `
        UPDATE property_images
        SET is_primary = 1
        WHERE property_id = ?
          AND image_id = ?
      `,
      [propertyId, imageId],
    );

    return res.json({
      message: "Cover photo updated.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update cover photo.",
    });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    await ensureTables();

    const propertyId = Number(req.params.id);
    const mediaId = Number(req.params.mediaId);
    const mediaType = String(
      req.params.type || "",
    ).toLowerCase();

    const sellerId = getUserId(req);

    if (
      !propertyId ||
      !mediaId ||
      !sellerId ||
      !(await sellerOwnsProperty(propertyId, sellerId))
    ) {
      return res.status(403).json({
        message: "Media access denied.",
      });
    }

    if (mediaType === "image") {
      const [rows] = await db.query(
        `
          SELECT image_url, is_primary
          FROM property_images
          WHERE property_id = ?
            AND image_id = ?
          LIMIT 1
        `,
        [propertyId, mediaId],
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "Image not found.",
        });
      }

      await db.query(
        `
          DELETE FROM property_images
          WHERE property_id = ?
            AND image_id = ?
        `,
        [propertyId, mediaId],
      );

      await deleteFile(rows[0].image_url);
    } else if (mediaType === "video") {
      const [rows] = await db.query(
        `
          SELECT video_url
          FROM property_videos
          WHERE property_id = ?
            AND video_id = ?
          LIMIT 1
        `,
        [propertyId, mediaId],
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      await db.query(
        `
          DELETE FROM property_videos
          WHERE property_id = ?
            AND video_id = ?
        `,
        [propertyId, mediaId],
      );

      await deleteFile(rows[0].video_url);
    } else {
      return res.status(400).json({
        message: "Invalid media type.",
      });
    }

    return res.json({
      message: "Media removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not remove property media.",
    });
  }
};
