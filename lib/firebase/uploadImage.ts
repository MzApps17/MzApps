// lib/uploadImage.ts
export async function uploadImage(file: File): Promise<string> {
  // TUNAH - imagebb hmang
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_KEY}`, {
    method: "POST",
    body: form
  });
  const data = await res.json();
  return data.data.url;

  // NAKINAH - hemi 4 lines chiah thlak la, Firebase ah a kal nghal ang
  // import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
  // const storage = getStorage();
  // const r = ref(storage, `products/${Date.now()}_${file.name}`);
  // await uploadBytes(r, file);
  // return await getDownloadURL(r);
}
