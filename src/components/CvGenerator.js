import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateCV = async (data, { t: i18n }) => {
  // Crear el PDF en formato A4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colores
  const colors = {
    primary: [8, 145, 178], // El color accent de tu tema
    text: [75, 85, 99],     // Un gris oscuro para el texto principal
    subtext: [156, 163, 175] // Un gris más claro para texto secundario
  };

  // Configuración de estilos
  const styles = {
    header: { 
      fontSize: 28, 
      fontStyle: 'bold',
      color: colors.primary
    },
    sectionTitle: { 
      fontSize: 16, 
      fontStyle: 'bold',
      color: colors.primary,
      marginTop: 6
    },
    subheader: { 
      fontSize: 14, 
      fontStyle: 'bold',
      color: colors.text
    },
    normal: { 
      fontSize: 11,
      color: colors.text
    },
    small: { 
      fontSize: 10,
      color: colors.subtext
    }
  };

  // Función helper para añadir texto con color
  const addText = (text, style, x = margin, maxWidth = contentWidth - (x - margin)) => {
    pdf.setFontSize(style.fontSize);
    pdf.setFont(undefined, style.fontStyle || 'normal');
    pdf.setTextColor(...(style.color || colors.text));
    
    // Si el texto es muy largo, lo dividimos en múltiples líneas
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach(line => {
      // Verificar si necesitamos una nueva página
      if (yPos > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, x, yPos);
      yPos += (style.fontSize * 0.4);
    });
    
    // Añadir espacio extra después del texto solo si no es un título de sección
    if (!style.noExtraSpace) {
      yPos += style.fontSize * 0.2;
    }
  };

  // Función para añadir una línea divisoria
  const addDivider = () => {
    // No añadir espacio antes de la línea cuando viene después de un título
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6; // Espacio consistente después de cada línea divisoria
  };

  // Función para añadir sección
  const addSection = (title, content) => {
    // Añadir título de sección con margen superior consistente
    addText(title.toUpperCase(), { ...styles.sectionTitle, marginTop: 6, noExtraSpace: true });
    addDivider();

    // Añadir contenido
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'string') {
          addText(item, styles.normal);
        } else {
          Object.entries(item).forEach(([key, value]) => {
            addText(`${key}: ${value}`, styles.normal);
          });
        }
      });
    } else if (content) {
      addText(content, styles.normal);
    }

    // Añadir espacio después de la sección
    yPos += 8;
  };

  // Función para añadir sección en dos columnas
  const addTwoColumnSection = (leftTitle, leftContent, rightTitle, rightContent) => {
    const columnWidth = (contentWidth - margin) / 2;
    const rightColumnX = margin + columnWidth + margin;
    const startY = yPos;

    // Columna izquierda
    addText(leftTitle.toUpperCase(), { ...styles.sectionTitle, marginTop: 6, noExtraSpace: true });
    yPos += 0.5; // Pequeño ajuste para alinear las líneas divisorias
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, margin + columnWidth - margin/2, yPos);
    yPos += 6;

    if (Array.isArray(leftContent)) {
      leftContent.forEach(item => {
        if (typeof item === 'string') {
          addText(item, styles.normal, margin, columnWidth);
        } else {
          Object.entries(item).forEach(([key, value]) => {
            addText(`${key}: ${value}`, styles.normal, margin, columnWidth);
          });
        }
      });
    } else if (leftContent) {
      addText(leftContent, styles.normal, margin, columnWidth);
    }

    // Guardar la posición Y más baja de la columna izquierda
    const leftColumnEndY = yPos;

    // Columna derecha
    yPos = startY;
    addText(rightTitle.toUpperCase(), { ...styles.sectionTitle, marginTop: 6, noExtraSpace: true }, rightColumnX);
    yPos += 0.5; // Pequeño ajuste para alinear las líneas divisorias
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(rightColumnX, yPos, rightColumnX + columnWidth - margin/2, yPos);
    yPos += 6;

    if (Array.isArray(rightContent)) {
      rightContent.forEach(item => {
        if (typeof item === 'string') {
          addText(item, styles.normal, rightColumnX, columnWidth);
        } else {
          Object.entries(item).forEach(([key, value]) => {
            addText(`${key}: ${value}`, styles.normal, rightColumnX, columnWidth);
          });
        }
      });
    } else if (rightContent) {
      addText(rightContent, styles.normal, rightColumnX, columnWidth);
    }

    // Usar la posición Y más baja de ambas columnas
    yPos = Math.max(yPos, leftColumnEndY);
    yPos += 8; // Espacio después de la sección
  };

  // Función para cargar una imagen como base64
  const loadImageAsBase64 = async (path) => {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  // Función para añadir imagen
  const addImage = async (imagePath, x, y, width, height) => {
    try {
      const imageData = await loadImageAsBase64(imagePath);
      pdf.addImage(imageData, 'JPEG', x, y, width, height);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  // Encabezado con imagen
  const startY = yPos;
  
  // Imagen a la derecha
  const imageUrl = new URL('/src/assets/images/perfil00.png', import.meta.url).href;
  const imageWidth = 40; // Ancho fijo en mm
  const imageHeight = 50; // Alto ajustado para mantener la proporción
  const imageX = pageWidth - margin - imageWidth;
  await addImage(imageUrl, imageX, startY - 8, imageWidth, imageHeight); // Subido 8mm
  
  // Texto a la izquierda (ajustado para no solapar con la imagen)
  const textWidth = pageWidth - margin - imageWidth - margin - margin;
  addText('Israel Moreno Labrador', { ...styles.header, noExtraSpace: true }, margin, textWidth);
  yPos -= 3; // Reducido el espacio entre el nombre y el rol
  addText(i18n('home.role'), { ...styles.subheader, color: colors.primary }, margin, textWidth);
  
  yPos += 4; // Espacio antes de los enlaces
  
  // Añadir enlaces (ajustados al mismo ancho que el texto)
  const socialLinks = [
    'Portfolio: https://imorlab.github.io/imorlab-portfolio/',
    'LinkedIn: https://www.linkedin.com/in/israelmorenolabrador/',
    'GitHub: https://github.com/imorlab'
  ];
  
  socialLinks.forEach(link => {
    addText(link, { ...styles.small, color: colors.primary }, margin, textWidth);
  });
  
  yPos = Math.max(yPos, startY + imageHeight + 2); // Asegurarnos de que estamos debajo de la imagen
  yPos += 8; // Espacio después de la sección de encabezado

  // Sobre mí
  addSection(i18n('about.title'), [
    i18n('about.description'),
    i18n('about.mission')
  ]);

  // Experiencia Profesional
  if (data.experience && data.experience.positions) {
    addSection(i18n('about.experience.title'), null);
    data.experience.positions.forEach((position, index) => {
      if (index > 0) yPos += 6;
      
      // Título y empresa
      addText(position.role, styles.subheader);
      addText(position.company, { ...styles.normal, fontStyle: 'bold' });
      
      // Periodo, ubicación y tipo
      addText(`${position.period} | ${position.location} | ${position.type}`, styles.small);
      
      // Responsabilidades
      if (position.responsibilities && position.responsibilities.length > 0) {
        yPos += 2;
        position.responsibilities.forEach(resp => {
          addText(`• ${resp}`, styles.normal, margin + 5);
        });
      }
      
      // Habilidades utilizadas
      if (position.skills && position.skills.length > 0) {
        yPos += 2;
        addText('Tecnologías: ' + position.skills.join(' • '), styles.small);
      }
    });
    yPos += 8; // Espacio consistente después de la sección
  }

  // Educación
  if (data.education && data.education.items) {
    addSection(i18n('about.education.title'), null);
    data.education.items.forEach((edu, index) => {
      if (index > 0) yPos += 6;
      
      // Título y campo
      addText(edu.degree, styles.subheader);
      addText(edu.field, { ...styles.normal, fontStyle: 'bold' });
      
      // Institución y periodo
      addText(`${edu.school} | ${edu.period}`, styles.small);
      
      // Habilidades/Conocimientos adquiridos
      if (edu.skills) {
        yPos += 2;
        addText(edu.skills, styles.normal, margin + 5);
      }
    });
    yPos += 8; // Espacio consistente después de la sección
  }

  // Habilidades técnicas y blandas en dos columnas
  const skillsSection = i18n('about.skills.title');
  const skillCategories = Object.entries(data.skills.categories || {})
    .filter(([key]) => key !== 'soft')
    .map(([key, category]) => ({
      [category.title]: (category.items || []).map(item => item.name).join(' • ')
    }));

  let softSkills = [];
  if (data.skills.soft && data.skills.soft.items) {
    softSkills = data.skills.soft.items.map(skill => `• ${skill}`);
  }

  addTwoColumnSection(
    skillsSection,
    skillCategories,
    data.skills.soft.title,
    softSkills
  );

  // Añadir pie de página con la fecha de generación
  const date = new Date().toLocaleDateString();
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.subtext);
  pdf.text(`Generado el ${date}`, margin, pageHeight - 10);

  return pdf;
};
