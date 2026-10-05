// Achicar fotos antes de guardarlas (las de celular pesan 3–5 MB).

// Foto para galería / lista de precios / recetas / eventos: antes se guardaba
// el original (3–5 MB por foto de celular). Ahora se achica a 1400px JPEG; si
// no es una imagen comprimible (GIF, SVG u otro), se guarda tal cual.
export function leerFotoComprimida(file, cb){
  if(/^image\/(jpeg|png|webp|heic|heif)/i.test(file.type||'')) comprimirImagen(file, 1400, 0.75, cb);
  else { const r = new FileReader(); r.onload = e => cb(e.target.result); r.readAsDataURL(file); }
}

export function comprimirImagen(file, maxDim, calidad, cb){
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width*escala);
      canvas.height = Math.round(img.height*escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', calidad));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
