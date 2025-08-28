import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'RECIPIENT_EMAIL'
];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}); // Vérification des variables d'environnement

const app = express();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite à 10 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés.'));
    }
  }
});
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465 port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
});

app.post('/api/applications', upload.single('resume'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      birthDate,
      maritalStatus,
      address,
      diploma,
      school,
      gradYear,
      lastJob,
      company,
      jobDuration,
      jobDescription,
      positionWanted,
      contractType,
      availability,
      languages,
      hasLicense,
      motivation,
    } = req.body;

    // Validation simple
    if (
      !fullName || typeof fullName !== 'string' ||
      !email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      !positionWanted || typeof positionWanted !== 'string'
      
    ) {
      // Nettoyage du fichier uploadé si présent
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Champs obligatoires invalides ou manquants.' });
    }

    // Create email content
    const emailContent = `
      New Job Application Received
      
      Personal Information:
      Full Name: ${fullName}
      Email: ${email}
      Phone: ${phone}
      Birth Date: ${birthDate}
      Marital Status: ${maritalStatus}
      Address: ${address}
      
      Education:
      Diploma: ${diploma}
      School: ${school}
      Graduation Year: ${gradYear}
      
      Work Experience:
      Last Job: ${lastJob}
      Company: ${company}
      Job Duration: ${jobDuration}
      Job Description: ${jobDescription}
      
      Position Details:
      Position Wanted: ${positionWanted}
      Contract Type: ${contractType}
      Availability: ${availability}
      Languages: ${languages}
      Has License: ${hasLicense}
      
      Motivation:
      ${motivation}
    `;

    // Prepare email with attachment
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Job Application - ${fullName} for ${positionWanted}`,
      text: emailContent,
      attachments: req.file ? [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ] : []
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Clean up uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Failed to process application' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation simple
    if (
      !name || typeof name !== 'string' ||
      !email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      !message || typeof message !== 'string'
    ) {
      return res.status(400).json({ error: 'Champs invalides ou manquants.' });
    }

    // Create email content
    const emailContent = `
      New Contact Form Submission

      From: ${name}
      Email: ${email}
      
      Message:
      ${message}
    `;

    // Prepare email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Contact Form Message from ${name}`,
      text: emailContent
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Gestion des erreurs Multer (fichier trop gros, mauvais format, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Le fichier est trop volumineux (max 10 Mo).' });
    }
    return res.status(400).json({ error: `Erreur d'upload : ${err.message}` });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});