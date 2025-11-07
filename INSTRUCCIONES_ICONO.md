# Instrucciones para Configurar el Ícono de Hulk Rojo

## Paso 1: Convertir la Imagen

La imagen `assets/hulk rojo.avif` debe ser convertida a PNG para usarla como ícono de la app.

### Opciones para convertir:

#### Opción A: Usando una herramienta en línea
1. Ir a https://convertio.co/es/avif-png/
2. Subir el archivo `hulk rojo.avif`
3. Convertir a PNG
4. Descargar el resultado

#### Opción B: Usando ImageMagick (si lo tienes instalado)
```bash
cd assets
convert "hulk rojo.avif" "hulk-rojo.png"
```

#### Opción C: Usando Python con Pillow
```bash
pip install pillow pillow-avif-plugin
python3 << EOF
from PIL import Image
img = Image.open('assets/hulk rojo.avif')
img.save('assets/hulk-rojo.png', 'PNG')
EOF
```

## Paso 2: Crear el Ícono de la App

Una vez tengas el archivo PNG, necesitas crear los íconos en los tamaños correctos:

### Usando expo-icon
```bash
# Instalar la herramienta
npm install -g @expo/image-utils

# Generar íconos (1024x1024 recomendado como fuente)
# Primero, redimensiona tu imagen a 1024x1024 y guárdala como icon.png en assets/
```

### Manualmente con una herramienta online:
1. Ir a https://easyappicon.com/
2. Subir la imagen PNG del Hulk rojo
3. Descargar los íconos generados
4. Reemplazar `assets/icon.png` con la versión de 1024x1024
5. Para el splash, crear una versión más grande si es necesario

## Paso 3: Configuración Actual

El `app.json` ya está configurado para usar:
- **Ícono**: `./assets/icon.png` 
- **Color de fondo del ícono adaptativo**: `#8d1a1a` (rojo oscuro)
- **Splash screen**: fondo `#2a0a0a` (rojo muy oscuro)

## Paso 4: Generar la APK con el nuevo ícono

```bash
# Después de reemplazar el ícono
eas build -p android --profile apk
```

## Notas Importantes

- El ícono debe ser PNG de 1024x1024 píxeles
- Debe tener fondo transparente o el color de fondo se verá con el adaptiveIcon
- El formato AVIF no es soportado directamente por Expo, por eso necesita conversión
- La imagen de Hulk debe estar centrada y no muy cerca de los bordes (safe area)

## Comandos Rápidos

```bash
# Ver la imagen actual
ls -lh "assets/hulk rojo.avif"

# Después de convertir, reemplazar el ícono
cp assets/hulk-rojo.png assets/icon.png

# Probar localmente antes de compilar
npx expo start
```
