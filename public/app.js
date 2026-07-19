// Fight Club NSW - client-side interactivity. No build step, no framework.
document.addEventListener("DOMContentLoaded", () => {
  initBoxerTypeWeights();
  initTitleFields();
  initTabs();
  initPhotoPreview();
});

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
