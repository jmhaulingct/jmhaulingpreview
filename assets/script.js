// ----------------------------
// Supabase Connection
// ----------------------------

const SUPABASE_URL = "https://ocjtsdjxgozlcymyboja.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D9aoJfd0GHu2HoETNx2qJQ_Z70NzJE7";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
const photos=document.getElementById('photos');
    const previews=document.getElementById('previews');
    const status=document.getElementById('fileStatus');
    photos.addEventListener('change',()=>{
      previews.innerHTML='';
      const files=[...photos.files];
      status.textContent=files.length?`${files.length} photo${files.length===1?'':'s'} selected.`:'Clear photos help us quote accurately.';
      files.slice(0,6).forEach(file=>{const img=document.createElement('img');img.alt='Selected photo preview';img.src=URL.createObjectURL(file);previews.appendChild(img)});
    });
    // ----------------------------
// Submit Quote Request
// ----------------------------

const quoteForm = document.getElementById("quoteForm");
const successMessage = document.getElementById("success");
const submitButton = quoteForm.querySelector('button[type="submit"]');

quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  successMessage.style.display = "none";
  submitButton.disabled = true;
  submitButton.textContent = "Sending Request...";

  try {
    const selectedPhotos = [...photos.files];
    const uploadedPhotoPaths = [];

    // Give each submission its own unique folder.
    const submissionFolder = crypto.randomUUID();

    // Upload every selected photo to Supabase Storage.
    for (const file of selectedPhotos) {
      const safeFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-");

      const filePath = `${submissionFolder}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
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

    // Save the customer's information and photo paths.
    const { error: quoteError } = await supabase
      .from("quote_requests")
      .insert({
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        town: document.getElementById("town").value,
        location: document.getElementById("location").value,
        description: document.getElementById("description").value.trim(),
        timeframe: document.getElementById("timeframe").value,
        photos: JSON.stringify(uploadedPhotoPaths),
        status: "New Lead"
      });

    if (quoteError) {
      throw quoteError;
    }

    successMessage.textContent =
      "Thank you! Your quote request and photos were sent successfully.";
    successMessage.style.display = "block";

    quoteForm.reset();
    previews.innerHTML = "";
    status.textContent = "Clear photos help us quote accurately.";

    successMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  } catch (error) {
    console.error("Quote submission failed:", error);

    alert(
      `Your request could not be sent. ${
        error.message || "Please try again or call JM Hauling."
      }`
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Get My Free Quote";
  }
});
    
