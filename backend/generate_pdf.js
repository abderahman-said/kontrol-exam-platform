const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const doc = new PDFDocument({ size: 'A4', margin: 40 });
const filePath = path.join(uploadsDir, 'math_exam_sample.pdf');
const writeStream = fs.createWriteStream(filePath);
doc.pipe(writeStream);

// Load Arial font
const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
const fontBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';

doc.font(fontBoldPath).fontSize(22).fillColor('#0f172a').text('Kontrol | Educational Exam Sheet', { align: 'center' });
doc.moveDown(0.3);
doc.font(fontBoldPath).fontSize(14).fillColor('#059669').text('Exam: Quick Math Review - Secondary 3', { align: 'center' });
doc.moveDown(0.4);
doc.fontSize(10).font(fontPath).fillColor('#64748b').text('Duration: 30 Mins   |   Total Questions: 5   |   Exam Code: 45TFWG', { align: 'center' });
doc.moveDown(0.8);
doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1.2);

const questions = [
  {
    num: 1,
    title: 'Question 1: If f(x) = 3x^2 + 5x - 7, what is the derivative value f\'(2)?',
    options: ['(A) 12', '(B) 17', '(C) 21', '(D) 10']
  },
  {
    num: 2,
    title: 'Question 2: What is the limit value: lim(x -> 0) [sin(5x) / x]?',
    options: ['(A) 5', '(B) 1', '(C) 0', '(D) Undefined']
  },
  {
    num: 3,
    title: 'Question 3: In a geometric sequence where a = 3 and r = 2, find the 5th term (T5):',
    options: ['(A) 24', '(B) 32', '(C) 48', '(D) 96']
  },
  {
    num: 4,
    title: 'Question 4: Find the integral: Integral of (4x^3 + 2x) dx equals:',
    options: ['(A) x^4 + 2x + C', '(B) x^4 + x^2 + C', '(C) 12x^2 + 2 + C', '(D) 4x^4 + x^2 + C']
  },
  {
    num: 5,
    title: 'Question 5: If matrix A = [[2, 1], [3, 4]], calculate the determinant |A|:',
    options: ['(A) 11', '(B) 5', '(C) 8', '(D) -5']
  }
];

questions.forEach(q => {
  doc.font(fontBoldPath).fontSize(12).fillColor('#1e293b').text(q.title);
  doc.moveDown(0.3);
  doc.font(fontPath).fontSize(10).fillColor('#334155');
  doc.text(q.options.join('         '));
  doc.moveDown(1.4);
});

doc.moveDown(0.8);
doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1);
doc.font(fontBoldPath).fontSize(9).fillColor('#059669').text('Shade your answers on the digital answer sheet on the left. Good luck!', { align: 'center' });

doc.end();

writeStream.on('finish', () => {
  console.log('✅ PDF generated successfully at:', filePath);
  // Also copy to root folder for convenient user upload
  const rootCopy = path.join(__dirname, '../../math_exam_sample.pdf');
  fs.copyFileSync(filePath, rootCopy);
  console.log('✅ Copied to workspace root as:', rootCopy);
});
