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

let selectedPhotoFiles = [];

photosInput.addEventListener("change", () => {
  successMessage.style.display = "none";
  submitButton.disabled = false;
  submitButton.textContent = "Get My Free Quote";

  // Add newly selected photos to our list.
  selectedPhotoFiles = [
    ...selectedPhotoFiles,
    ...Array.from(photosInput.files)
  ];

  updatePhotoInput();
  renderPhotoPreviews();
});

function updatePhotoInput() {
  const dataTransfer = new DataTransfer();

  selectedPhotoFiles.forEach((file) => {
    dataTransfer.items.add(file);
  });

  photosInput.files = dataTransfer.files;
}

function renderPhotoPreviews() {
  previews.innerHTML = "";

  fileStatus.textContent = selectedPhotoFiles.length
    ? `${selectedPhotoFiles.length} photo${
        selectedPhotoFiles.length === 1 ? "" : "s"
      } selected.`
    : "No photos selected yet.";

  selectedPhotoFiles.forEach((file, index) => {
    const previewWrapper = document.createElement("div");
    previewWrapper.className = "preview-item";

    const previewImage = document.createElement("img");
previewImage.alt = "Selected job photo preview";

const imageUrl = URL.createObjectURL(file);
previewImage.src = imageUrl;

previewImage.onload = () => {
  URL.revokeObjectURL(imageUrl);
};

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-photo";
    removeButton.textContent = "×";
    removeButton.setAttribute(
      "aria-label",
      `Remove photo ${index + 1}`
    );

    removeButton.addEventListener("click", () => {
      selectedPhotoFiles.splice(index, 1);

      updatePhotoInput();
      renderPhotoPreviews();
    });

    previewWrapper.appendChild(previewImage);
    previewWrapper.appendChild(removeButton);
    previews.appendChild(previewWrapper);
  });
}

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
    let photoUploadFailed = false;
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
  console.error(
    "Photo upload failed, but continuing with quote submission:",
    uploadError
  );
  photoUploadFailed = true;
  continue;
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
// Send JM Hauling an email notification.
// The quote is already saved, so an email problem should not
// make the customer think their submission failed.
const { error: emailError } =
  await supabaseClient.functions.invoke("send-quote-email", {
    body: {
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

      photos: uploadedPhotoPaths
    }
  });

if (emailError) {
  console.error(
    "Quote saved, but email notification failed:",
    emailError
  );
}
    // Tell Meta a real quote request was successfully submitted.
if (typeof fbq === "function") {
  fbq("track", "Lead");
}
    // Tell Google Analytics a real quote request was successfully submitted.
if (typeof gtag === "function") {
  gtag("event", "generate_lead");
}
    // Clear the form for the next quote.
quoteForm.reset();
selectedPhotoFiles = [];
updatePhotoInput();
renderPhotoPreviews();
    
    // Only show success after Supabase confirms the submission.
    successMessage.innerHTML = photoUploadFailed
  ? `
      <strong>Quote request received!</strong><br>
      Your information was submitted successfully, but one or more photos
      may not have uploaded. Please text your photos to 860-341-2003 so we
      can give you the most accurate quote.
    `
  : `
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
    
