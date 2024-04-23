const express = require('express');
const Jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware para procesar JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));

// Ruta raíz que devuelve el formulario HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Ruta para procesar la imagen
app.post('/process', async (req, res) => {
  const imageUrl = req.body.imageUrl;
  console.log('Procesando imagen desde', imageUrl);

  try {
    // Descargar la imagen desde la URL proporcionada
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer' // Indicar que la respuesta es un array de bytes
    });

    // Verificar si la respuesta es válida
    if (!response.data || response.data.length === 0) {
      throw new Error('Respuesta vacía al descargar la imagen');
    }

    // Leer la imagen descargada con Jimp
    const image = await Jimp.read(response.data);

    // Verificar si la imagen se pudo leer correctamente
    if (!image) {
      throw new Error('No se pudo leer la imagen con Jimp');
    }

    // Procesar la imagen en escala de grises y redimensionarla a 350px de ancho
    await image.resize(350, Jimp.AUTO).grayscale();

    // Generar un nombre único para la imagen
    const imageName = `${uuidv4()}.jpg`;
    const imagePath = `public/${imageName}`;

    // Verificar si la carpeta 'public' existe, si no, crearla
    try {
      await fs.access('public');
    } catch (err) {
      await fs.mkdir('public');
    }

    // Almacenar la imagen procesada en el servidor
    await image.writeAsync(imagePath);

    // Verificar si la imagen se guardó correctamente
    try {
      await fs.access(imagePath);
    } catch (err) {
      throw new Error('No se pudo guardar la imagen');
    }

    console.log('Imagen procesada y guardada como', imageName);
    res.sendFile(__dirname + `/${imagePath}`);
  } catch (error) {
    console.error('Error al procesar la imagen:', error.message);
    res.status(500).send(`Error al procesar la imagen: ${error.message}`);
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
