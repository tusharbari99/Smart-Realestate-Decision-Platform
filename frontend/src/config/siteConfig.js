const siteConfig = {
  brandName: "The homeasy",

  supportPhone:
    import.meta.env.VITE_SUPPORT_PHONE ||
    "+91 00000 00000",

  supportEmail:
    import.meta.env.VITE_SUPPORT_EMAIL ||
    "support@smartestate.com",

  officeLocation:
    import.meta.env.VITE_OFFICE_LOCATION ||
    "Pune, Maharashtra",

  websiteUrl:
    import.meta.env.VITE_SITE_URL ||
    "http://localhost:5173",
};

export default siteConfig;
