// ----------------------------
// Supabase Connection
// ----------------------------

const SUPABASE_URL =
  "https://ocjtsdjxgozlcymyboja.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_D9aoJfd0GHu2HoETNx2qJQ_Z70NzJE7";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ----------------------------
// Form Elements
// ----------------------------

const quoteForm = document.getElementById("quoteForm");
const photosInput = document.getElementById("photos");
const previews = document.getElementById("previews");
const fileStatus = document.getElementById("fileStatus");
const successMessage = document.getElementById("success");
const submitButton = quoteForm.querySelector(
  'button[type="submit"]'
);

// Keep confirmation hidden until Supabase accepts the request.
successMessage.style.display = "none";


// ----------------------------
// Photo Previews
// ----------------------------

photosInput.addEventListener("change", () => {
  successMessage.style.display = "none";
  submitButton.disabled = false;
  submitButton.textContent = "Get My Free Quote";

  previews.innerHTML = "";

  const selectedFiles = Array.from(photosInput.files);

  fileStatus.textContent = selectedFiles.length
    ? `${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} selected.`
    : "No photos selected yet.";

  selectedFiles.slice(0, 6).forEach((file) => {
    const previewImage = document.createElement("img");

    previewImage.alt = "Selected job photo preview";
    previewImage.src = URL.createObjectURL(file);

    previews.appendChild(previewImage);
  });
});

// ----------------------------
// Multi-Step Form Navigation
// ----------------------------

const formSteps = Array.from(
  document.querySelectorAll(".form-step")
);

const nextButtons = Array.from(
  document.querySelectorAll(".next-step")
);

const previousButtons = Array.from(
  document.querySelectorAll(".prev-step")
);

const stepLabel = document.getElementById("stepLabel");
const stepName = document.getElementById("stepName");
const progressBar = document.getElementById("progressBar");

const stepNames = [
  "Contact",
  "Job Details",
  "Photos"
];

let currentStep = 0;

function showStep(stepIndex) {
  formSteps.forEach((step, index) => {
    step.classList.toggle(
      "active",
      index === stepIndex
    );
  });

  currentStep = stepIndex;

  stepLabel.textContent =
    `Step ${currentStep + 1} of ${formSteps.length}`;

  stepName.textContent =
    stepNames[currentStep];

  progressBar.style.width =
    `${((currentStep + 1) / formSteps.length) * 100}%`;
}

function validateCurrentStep() {
  const requiredFields = Array.from(
    formSteps[currentStep].querySelectorAll(
      "input[required], select[required], textarea[required]"
    )
  );

  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = Math.min(
      currentStep + 1,
      formSteps.length - 1
    );

    showStep(nextStep);
  });
});

previousButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const previousStep = Math.max(
      currentStep - 1,
      0
    );

    showStep(previousStep);
  });
});

showStep(0);


// ----------------------------
// Submit Quote Request
// ----------------------------

quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateCurrentStep()) {
    return;
  }

  successMessage.style.display = "none";
  submitButton.disabled = true;
  submitButton.textContent = "Sending Request...";

  try {
    const selectedPhotos = Array.from(photosInput.files);
    const uploadedPhotoPaths = [];
    const submissionFolder = crypto.randomUUID();

    // Upload each selected photo.
    for (const file of selectedPhotos) {
      const safeFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-");

      const filePath =
        `${submissionFolder}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } =
        await supabaseClient.storage
          .from("quote_photos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPhotoPaths.push(filePath);
    }

    const selectedUrgency =
      document.querySelector(
        'input[name="urgency"]:checked'
      )?.value || "ASAP";

    const preferredDate =
      document.getElementById("preferredDate").value;

    // Save the request to the database.
    const { error: quoteError } =
      await supabaseClient
        .from("quote_requests")
        .insert({
          name: document
            .getElementById("name")
            .value
            .trim(),

          phone: document
            .getElementById("phone")
            .value
            .trim(),

          town: document
            .getElementById("town")
            .value,

          item_location: document
            .getElementById("location")
            .value,

          description: document
            .getElementById("description")
            .value
            .trim(),

          timeframe: selectedUrgency,

          scheduled_date: preferredDate || null,

          photos: JSON.stringify(uploadedPhotoPaths),

          status: "New Lead"
        });

    if (quoteError) {
      throw quoteError;
    }

    // Only show success after Supabase confirms the submission.
    successMessage.innerHTML = `
      <strong>Quote request received!</strong><br>
      Thank you. JM Hauling will review your information and photos
      and contact you shortly.
    `;

    successMessage.style.display = "block";

    submitButton.disabled = true;
    submitButton.textContent = "Request Sent ✓";

    successMessage.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } catch (error) {
    console.error("Quote submission failed:", error);

    alert(
      `Your request could not be sent. ${
        error.message ||
        "Please try again or call JM Hauling."
      }`
    );

    submitButton.disabled = false;
    submitButton.textContent = "Get My Free Quote";
  }
});
    
