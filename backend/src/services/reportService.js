import PDFDocument from 'pdfkit';

export const generateComplaintsCsv = (complaints) => {
  const headers = [
    'Complaint Reference',
    'Date Submitted',
    'Citizen Name',
    'Citizen Phone',
    'Waste Type',
    'Category',
    'Priority',
    'Status',
    'Assigned Worker',
    'Zone',
    'Address',
    'Latitude',
    'Longitude',
    'Completed At',
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = complaints.map((c) => [
    escapeCsv(c.complaintReference),
    escapeCsv(new Date(c.createdAt).toLocaleDateString()),
    escapeCsv(c.citizen?.fullName || 'N/A'),
    escapeCsv(c.citizen?.phone || 'N/A'),
    escapeCsv(c.wasteType),
    escapeCsv(c.category),
    escapeCsv(c.priority),
    escapeCsv(c.status),
    escapeCsv(c.assignedWorker?.user?.fullName || 'Unassigned'),
    escapeCsv(c.serviceZone?.name || 'Unassigned'),
    escapeCsv(c.address),
    escapeCsv(c.latitude),
    escapeCsv(c.longitude),
    escapeCsv(c.completedAt ? new Date(c.completedAt).toLocaleDateString() : 'N/A'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

export const generateComplaintsPdfStream = (complaints, stream, meta = {}) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(stream);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#2E7D32');
  doc.fillColor('#FFFFFF').fontSize(20).text('Smart Waste Management System', 40, 20);
  doc.fontSize(12).text('Community Service Project - Complaints & Resolution Audit Report', 40, 48);

  doc.fillColor('#333333');
  doc.moveDown(3);

  // Metadata
  doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });
  doc.text(`Total Records Included: ${complaints.length}`, { align: 'right' });
  doc.moveDown();

  doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown();

  // Iterate complaints
  complaints.slice(0, 50).forEach((c, idx) => {
    if (doc.y > 700) {
      doc.addPage();
    }

    doc.fontSize(12).fillColor('#1976D2').text(`${idx + 1}. [${c.complaintReference}] - ${c.category}`);
    doc.fontSize(9).fillColor('#444444');
    doc.text(`   Status: ${c.status} | Priority: ${c.priority} | Waste Type: ${c.wasteType}`);
    doc.text(`   Citizen: ${c.citizen?.fullName || 'N/A'} (${c.citizen?.phone || 'N/A'})`);
    doc.text(`   Location: ${c.address}`);
    doc.text(`   Assigned Worker: ${c.assignedWorker?.user?.fullName || 'Unassigned'} | Zone: ${c.serviceZone?.name || 'N/A'}`);
    doc.text(`   Description: ${c.description}`);
    doc.moveDown(0.7);
  });

  if (complaints.length > 50) {
    doc.fontSize(9).fillColor('#888888').text(`... and ${complaints.length - 50} more records in database.`);
  }

  // Footer
  const pages = doc.bufferedPageRange();
  doc.end();
};
