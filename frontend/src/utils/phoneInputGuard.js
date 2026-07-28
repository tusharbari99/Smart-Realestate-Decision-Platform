const PHONE_INPUT_SELECTOR = [
  'input[name="phone"]',
  'input[name="mobile"]',
  'input[name="phone_number"]',
  'input[name="mobile_number"]',
  'input[name="contact_number"]',
  'input[name="contactNumber"]',
  'input[name="contact_no"]',
  'input[id*="phone" i]',
  'input[id*="mobile" i]'
].join(",");

function preparePhoneInput(input) {
  if (!(input instanceof HTMLInputElement)) return;
  if (input.dataset.phoneGuardReady === "true") return;

  input.dataset.phoneGuardReady = "true";
  input.type = "tel";
  input.inputMode = "numeric";
  input.minLength = 10;
  input.maxLength = 10;
  input.pattern = "[0-9]{10}";
  input.autocomplete = "tel";
  input.title = "Enter exactly 10 digits.";

  const validate = () => {
    const cleanValue = input.value.replace(/\D/g, "").slice(0, 10);

    if (input.value !== cleanValue) {
      input.value = cleanValue;
      input.dispatchEvent(
        new Event("input", {
          bubbles: true,
        })
      );
    }

    if (!cleanValue) {
      input.setCustomValidity("");
      return;
    }

    if (cleanValue.length !== 10) {
      input.setCustomValidity("Mobile number must contain exactly 10 digits.");
      return;
    }

    input.setCustomValidity("");
  };

  input.addEventListener("input", validate);
  input.addEventListener("change", validate);
  input.addEventListener("blur", validate);
  input.addEventListener("paste", () => {
    window.setTimeout(validate, 0);
  });

  validate();
}

function scanPhoneInputs(root = document) {
  if (root instanceof HTMLInputElement && root.matches(PHONE_INPUT_SELECTOR)) {
    preparePhoneInput(root);
  }

  root.querySelectorAll?.(PHONE_INPUT_SELECTOR).forEach(preparePhoneInput);
}

export function installPhoneInputGuard() {
  if (typeof document === "undefined") return;

  scanPhoneInputs();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          scanPhoneInputs(node);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) return;

      const phoneInputs = form.querySelectorAll(PHONE_INPUT_SELECTOR);

      for (const input of phoneInputs) {
        const value = input.value.replace(/\D/g, "");

        if (value && value.length !== 10) {
          input.setCustomValidity(
            "Mobile number must contain exactly 10 digits."
          );

          event.preventDefault();
          event.stopPropagation();
          input.reportValidity();
          input.focus();
          break;
        }

        input.setCustomValidity("");
      }
    },
    true
  );
}
