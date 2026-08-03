const photos=document.getElementById('photos');
    const previews=document.getElementById('previews');
    const status=document.getElementById('fileStatus');
    photos.addEventListener('change',()=>{
      previews.innerHTML='';
      const files=[...photos.files];
      status.textContent=files.length?`${files.length} photo${files.length===1?'':'s'} selected.`:'Clear photos help us quote accurately.';
      files.slice(0,6).forEach(file=>{const img=document.createElement('img');img.alt='Selected photo preview';img.src=URL.createObjectURL(file);previews.appendChild(img)});
    });
    document.getElementById('quoteForm').addEventListener('submit',e=>{
      e.preventDefault();
      document.getElementById('success').style.display='block';
      document.getElementById('success').scrollIntoView({behavior:'smooth',block:'nearest'});
    });
