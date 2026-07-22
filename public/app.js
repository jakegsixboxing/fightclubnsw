// Prizefighter Promotions - client-side interactivity. No build step, no framework.
document.addEventListener("DOMContentLoaded", () => {
  initBoxerTypeWeights();
  initTitleFields();
  initTabs();
  initPhotoPreview();
  initDivisionTabs();
  initWizard();
});

// Step-by-step wizard for the registration form ("Bang. Bang. Bang." — one
// clear question at a time instead of one long, dense form).
function initWizard() {
  const form = document.querySelector("[data-wizard]");
  if (!form) return;

  const stepEls = Array.from(form.querySelectorAll(".wizard-step"));
  const totalSteps = stepEls.length;
  const dots = Array.from(form.querySelectorAll("[data-wizard-dot]"));
  const titleEl = form.querySelector("[data-wizard-title]");
  const subEl = form.querySelector("[data-wizard-sub]");
  const backBtn = form.querySelector("[data-wizard-back]");
  const nextBtn = form.querySelector("[data-wizard-next]");
  const submitBtn = form.querySelector("[data-wizard-submit]");
  const heading = form.querySelector(".wizard-heading");
  if (!stepEls.length || !nextBtn) return;

  let currentStep = 1;
  let firstRender = true;

  function render() {
    stepEls.forEach((el) => {
      const step = Number(el.getAttribute("data-step"));
      el.hidden = step !== currentStep;
    });

    const activeEl = stepEls.find((el) => Number(el.getAttribute("data-step")) === currentStep);
    if (activeEl && titleEl) titleEl.textContent = activeEl.getAttribute("data-title") || "";
    if (activeEl && subEl) subEl.textContent = activeEl.getAttribute("data-sub") || "";

    dots.forEach((d) => {
      const n = Number(d.getAttribute("data-wizard-dot"));
      d.classList.toggle("active", n === currentStep);
      d.classList.toggle("done", n < currentStep);
    });

    if (backBtn) backBtn.hidden = currentStep === 1;
    nextBtn.hidden = currentStep === totalSteps;
    if (submitBtn) submitBtn.hidden = currentStep !== totalSteps;

    if (!firstRender && heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    firstRender = false;
  }

  function currentStepValid() {
    // Only validate fields belonging to the step that's actually visible.
    // form.checkValidity() checks the WHOLE form, including required fields
    // on steps the user hasn't reached yet — those are empty, so the whole
    // form always comes back invalid and the browser silently refuses to
    // advance (it can't show a validation bubble on a hidden field). Scoping
    // to just the current step's own fields avoids that trap.
    const activeEl = stepEls.find((el) => Number(el.getAttribute("data-step")) === currentStep);
    if (!activeEl) return true;
    const fields = activeEl.querySelectorAll("input, select, textarea");
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!currentStepValid()) return;
    if (currentStep < totalSteps) {
      currentStep++;
      render();
    }
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        render();
      }
    });
  }

  dots.forEach((d) => {
    d.addEventListener("click", () => {
      const n = Number(d.getAttribute("data-wizard-dot"));
      // Only allow jumping backward to a step already completed — keeps the
      // one-question-at-a-time flow instead of letting people skip ahead.
      if (n < currentStep) {
        currentStep = n;
        render();
      }
    });
  });

  render();
}

function initDivisionTabs() {
  const root = document.querySelector("[data-profiles]");
  if (!root) return;

  const typeButtons = root.querySelectorAll("[data-type-btn]");
  const pillGroups = root.querySelectorAll("[data-type-group]");
  const pills = root.querySelectorAll("[data-div-btn]");
  const cells = root.querySelectorAll("[data-fighter]");
  const emptyState = root.querySelector("[data-empty]");

  let activeType = "amateur";
  let activeDiv = { amateur: "all", professional: "all" };

  function apply() {
    // toggle type buttons
    typeButtons.forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-type-btn") === activeType)
    );
    // show the right pill group
    pillGroups.forEach((g) => {
      g.hidden = g.getAttribute("data-type-group") !== activeType;
    });
    // highlight active pill within active type
    pills.forEach((p) => {
      if (p.getAttribute("data-type") !== activeType) return;
      p.classList.toggle("active", p.getAttribute("data-div") === activeDiv[activeType]);
    });
    // filter fighter cells
    let shown = 0;
    cells.forEach((c) => {
      const matchType = c.getAttribute("data-type") === activeType;
      const div = activeDiv[activeType];
      const matchDiv = div === "all" || c.getAttribute("data-div") === div;
      const visible = matchType && matchDiv;
      c.style.display = visible ? "" : "none";
      if (visible) shown++;
    });
    if (emptyState) emptyState.hidden = shown !== 0;
  }

  typeButtons.forEach((b) =>
    b.addEventListener("click", () => {
      activeType = b.getAttribute("data-type-btn");
      apply();
    })
  );
  pills.forEach((p) =>
    p.addEventListener("click", () => {
      const type = p.getAttribute("data-type");
      activeType = type;
      activeDiv[type] = p.getAttribute("data-div");
      apply();
    })
  );

  apply();
}

function initBoxerTypeWeights() {
  const radios = document.querySelectorAll('input[name="boxer_type"]');
  const select = document.getElementById("weight_division_id");
  if (!radios.length || !select) return;

  const divisionsData = document.getElementById("weight-divisions-data");
  if (!divisionsData) return;
  const divisions = JSON.parse(divisionsData.textContent);

  function render(type) {
    const list = divisions[type] || [];
    const currentValue = select.getAttribute("data-selected") || "";
    select.innerHTML = list
      .map(
        (d) =>
          `<option value="${d.id}" ${String(d.id) === String(currentValue) ? "selected" : ""}>${d.label}</option>`
      )
      .join("");
  }

  radios.forEach((r) => {
    r.addEventListener("change", () => render(r.value));
  });

  const checked = document.querySelector('input[name="boxer_type"]:checked');
  render(checked ? checked.value : "amateur");
}

function initTitleFields() {
  const hasTitleRadios = document.querySelectorAll('input[name="has_title"]');
  const titleDetails = document.getElementById("title-details");
  const levelRadios = document.querySelectorAll('input[name="title_level"]');
  const regionField = document.getElementById("title-region-field");

  function updateHasTitle() {
    const checked = document.querySelector('input[name="has_title"]:checked');
    if (!titleDetails) return;
    titleDetails.style.display = checked && checked.value === "yes" ? "block" : "none";
  }
  function updateRegion() {
    const checked = document.querySelector('input[name="title_level"]:checked');
    if (!regionField) return;
    regionField.style.display = checked && checked.value === "regional" ? "block" : "none";
  }

  hasTitleRadios.forEach((r) => r.addEventListener("change", updateHasTitle));
  levelRadios.forEach((r) => r.addEventListener("change", updateRegion));
  updateHasTitle();
  updateRegion();
}

function initTabs() {
  const tabButtons = document.querySelectorAll("[data-tab-target]");
  if (!tabButtons.length) return;
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab-target");
      const group = btn.closest("[data-tab-group]");
      if (!group) return;
      group.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      group.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add("active");
    });
  });
}

function initPhotoPreview() {
  const input = document.getElementById("photo");
  const preview = document.getElementById("photo-preview");
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}
