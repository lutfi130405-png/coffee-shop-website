# Model 3D

Taruh model kustom Anda di folder ini dengan nama **`coffee.glb`**:

```
public/models/coffee.glb
```

`scene.js` memuatnya lewat `GLTFLoader` dari path `/models/coffee.glb`.

Jika file tidak ada, aplikasi otomatis memakai **model fallback prosedural**
(biji kopi emas dengan glow) sehingga proyek tetap jalan tanpa aset.

## Tips menyiapkan .glb

- Ekspor dari Blender: `File → Export → glTF 2.0 (.glb)`, aktifkan **+Y up**.
- Kompres dengan [gltf-transform](https://gltf-transform.dev/) atau
  [gltfpack](https://meshoptimizer.org/gltf/): `gltfpack -i in.glb -o coffee.glb -cc`
- Target ukuran < 3 MB untuk performa mobile.
- Jika model gelap, tambahkan material emissive tipis atau naikkan
  `toneMappingExposure` di `scene.js`.

## Model gratis untuk mulai

- Sketchfab (filter: Downloadable, CC): "coffee cup", "coffee bean", "espresso"
- Poly Pizza — https://poly.pizza
