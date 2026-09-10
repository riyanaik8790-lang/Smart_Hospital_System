-- Hospital Priority System Database Schema

-- =====================================================
-- USERS TABLE (For Login)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT 'Unknown',
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  status TEXT DEFAULT 'Available',
  phone TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  room_id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
  patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  category TEXT,
  priority_level INTEGER DEFAULT 3,
  priority_label TEXT DEFAULT 'Medium',
  doctor_id INTEGER,
  room_id INTEGER,
  status TEXT DEFAULT 'Admitted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- =====================================================
-- SEED DATA: USERS
-- =====================================================
INSERT INTO users (name, email, password, role) VALUES
('Admin Dr. Rajesh', 'admin@hospital.com', '$2b$10$KIXxPfxVIs.ZfvqPb1bIR.Rxa8pT6wc7Z8cPq7J3ZlVfM8Ib2FvC.', 'admin'),
('Dr. Anil Kumar',   'joe@hospital.com',   '$2b$10$KIXxPfxVIs.ZfvqPb1bIR.Rxa8pT6wc7Z8cPq7J3ZlVfM8Ib2FvC.', 'doctor'),
('Dr. Priya Sharma', 'sarah@hospital.com', '$2b$10$KIXxPfxVIs.ZfvqPb1bIR.Rxa8pT6wc7Z8cPq7J3ZlVfM8Ib2FvC.', 'doctor'),
('Dr. Vikram Singh', 'mike@hospital.com',  '$2b$10$KIXxPfxVIs.ZfvqPb1bIR.Rxa8pT6wc7Z8cPq7J3ZlVfM8Ib2FvC.', 'doctor');

-- =====================================================
-- SEED DATA: 50 INDIAN DOCTORS
-- Specialties: cardiac, trauma, eye, diabetes, neuro,
-- ortho, pediatric, general, skin, ENT,
-- Puimonar, Gastro, Oncology, Urology, Emergency
-- =====================================================
INSERT INTO doctors (name, specialization, status, phone, email) VALUES
('Dr. Rajesh Kumar',       'cardiac',    'Available', '+91-98201-11001', 'doctor1@gmail.com'),
('Dr. Priya Mehta',        'cardiac',    'Busy',      '+91-98201-11002', 'doctor2@gmail.com'),
('Dr. Anil Sharma',        'cardiac',    'Available', '+91-98201-11003', 'doctor3@gmail.com'),
('Dr. Kavita Reddy',       'cardiac',    'Available', '+91-98201-11004', 'doctor4@gmail.com'),

('Dr. Suresh Patel',       'trauma',     'Available', '+91-98201-11005', 'doctor5@gmail.com'),
('Dr. Neha Joshi',         'trauma',     'Busy',      '+91-98201-11006', 'doctor6@gmail.com'),
('Dr. Mohan Iyer',         'trauma',     'Available', '+91-98201-11007', 'doctor7@gmail.com'),

('Dr. Meera Nair',         'eye',        'Available', '+91-98201-11008', 'doctor8@gmail.com'),
('Dr. Arjun Pillai',       'eye',        'Available', '+91-98201-11009', 'doctor9@gmail.com'),
('Dr. Sunita Bose',        'eye',        'Busy',      '+91-98201-11010', 'doctor10@gmail.com'),

('Dr. Deepak Trivedi',     'diabetes',   'Available', '+91-98201-11011', 'doctor11@gmail.com'),
('Dr. Rekha Menon',        'diabetes',   'Available', '+91-98201-11012', 'doctor12@gmail.com'),
('Dr. Vikram Desai',       'diabetes',   'Busy',      '+91-98201-11013', 'doctor13@gmail.com'),

('Dr. Lakshmi Rao',        'neuro',      'Available', '+91-98201-11014', 'doctor14@gmail.com'),
('Dr. Ramesh Yadav',       'neuro',      'Busy',      '+91-98201-11015', 'doctor15@gmail.com'),
('Dr. Anita Gupta',        'neuro',      'Available', '+91-98201-11016', 'doctor16@gmail.com'),
('Dr. Tarun Saxena',       'neuro',      'Available', '+91-98201-11017', 'doctor17@gmail.com'),

('Dr. Sanjay Kapoor',      'ortho',      'Available', '+91-98201-11018', 'doctor18@gmail.com'),
('Dr. Pooja Verma',        'ortho',      'Busy',      '+91-98201-11019', 'doctor19@gmail.com'),
('Dr. Ravi Shankar',       'ortho',      'Available', '+91-98201-11020', 'doctor20@gmail.com'),
('Dr. Usha Bhatt',         'ortho',      'Available', '+91-98201-11021', 'doctor21@gmail.com'),

('Dr. Hema Kulkarni',      'pediatric',  'Available', '+91-98201-11022', 'doctor22@gmail.com'),
('Dr. Aditya Shetty',      'pediatric',  'Busy',      '+91-98201-11023', 'doctor23@gmail.com'),
('Dr. Chitra Mukherjee',   'pediatric',  'Available', '+91-98201-11024', 'doctor24@gmail.com'),

('Dr. Girish Nambiar',     'general',    'Available', '+91-98201-11025', 'doctor25@gmail.com'),
('Dr. Kamala Dubey',       'general',    'Available', '+91-98201-11026', 'doctor26@gmail.com'),
('Dr. Naresh Tiwari',      'general',    'Busy',      '+91-98201-11027', 'doctor27@gmail.com'),
('Dr. Savita Ghosh',       'general',    'Available', '+91-98201-11028', 'doctor28@gmail.com'),

('Dr. Pankaj Mishra',      'skin',       'Available', '+91-98201-11029', 'doctor29@gmail.com'),
('Dr. Vandana Sinha',      'skin',       'Available', '+91-98201-11030', 'doctor30@gmail.com'),
('Dr. Falguni Shah',       'skin',       'Busy',      '+91-98201-11031', 'doctor31@gmail.com'),

('Dr. Mahesh Pandey',      'ENT',        'Available', '+91-98201-11032', 'doctor32@gmail.com'),
('Dr. Nalini Hegde',       'ENT',        'Busy',      '+91-98201-11033', 'doctor33@gmail.com'),
('Dr. Qasim Ali',          'ENT',        'Available', '+91-98201-11034', 'doctor34@gmail.com'),

('Dr. Kiran Jain',         'Puimonar',   'Available', '+91-98201-11035', 'doctor35@gmail.com'),
('Dr. Rashmi Wagh',        'Puimonar',   'Available', '+91-98201-11036', 'doctor36@gmail.com'),
('Dr. Sachin Parekh',      'Puimonar',   'Busy',      '+91-98201-11037', 'doctor37@gmail.com'),

('Dr. Indira Krishnan',    'Gastro',     'Available', '+91-98201-11038', 'doctor38@gmail.com'),
('Dr. Jyoti Rajan',        'Gastro',     'Busy',      '+91-98201-11039', 'doctor39@gmail.com'),
('Dr. Lata Patil',         'Gastro',     'Available', '+91-98201-11040', 'doctor40@gmail.com'),

('Dr. Om Prakash',         'Oncology',   'Available', '+91-98201-11041', 'doctor41@gmail.com'),
('Dr. Padma Reddiar',      'Oncology',   'Busy',      '+91-98201-11042', 'doctor42@gmail.com'),
('Dr. Tanuja Bhosle',      'Oncology',   'Available', '+91-98201-11043', 'doctor43@gmail.com'),

('Dr. Umesh Karnik',       'Urology',    'Available', '+91-98201-11044', 'doctor44@gmail.com'),
('Dr. Geeta Agarwal',      'Urology',    'Available', '+91-98201-11045', 'doctor45@gmail.com'),
('Dr. Dinesh Parekh',      'Urology',    'Busy',      '+91-98201-11046', 'doctor46@gmail.com'),

('Dr. Shanti Chandra',     'Emergency',  'Available', '+91-98201-11047', 'doctor47@gmail.com'),
('Dr. Mohan Lal',          'Emergency',  'Busy',      '+91-98201-11048', 'doctor48@gmail.com'),
('Dr. Kiran Rao',          'Emergency',  'Available', '+91-98201-11049', 'doctor49@gmail.com'),
('Dr. Anita Bhat',         'Emergency',  'Available', '+91-98201-11050', 'doctor50@gmail.com');

-- =====================================================
-- SEED DATA: 50 ROOMS (Exactly 4 Emergency Rooms)
-- =====================================================
INSERT INTO rooms (room_number, type, status) VALUES
('E01', 'Emergency', 'Available'),
('E02', 'Emergency', 'Available'),
('E03', 'Emergency', 'Available'),
('E04', 'Emergency', 'Available'),
('101', 'General',   'Available'),
('102', 'General',   'Available'),
('103', 'General',   'Available'),
('104', 'General',   'Available'),
('105', 'General',   'Available'),
('106', 'General',   'Available'),
('107', 'General',   'Available'),
('108', 'General',   'Available'),
('109', 'General',   'Available'),
('110', 'General',   'Available'),
('111', 'General',   'Available'),
('112', 'General',   'Available'),
('113', 'General',   'Available'),
('114', 'General',   'Available'),
('115', 'General',   'Available'),
('116', 'General',   'Available'),
('117', 'General',   'Available'),
('118', 'General',   'Available'),
('119', 'General',   'Available'),
('120', 'General',   'Available'),
('121', 'General',   'Available'),
('122', 'General',   'Available'),
('123', 'General',   'Available'),
('124', 'General',   'Available'),
('125', 'General',   'Available'),
('126', 'General',   'Available'),
('201', 'ICU',       'Available'),
('202', 'ICU',       'Available'),
('203', 'ICU',       'Available'),
('204', 'ICU',       'Available'),
('205', 'ICU',       'Available'),
('206', 'ICU',       'Available'),
('207', 'ICU',       'Available'),
('208', 'ICU',       'Available'),
('209', 'ICU',       'Available'),
('210', 'ICU',       'Available'),
('211', 'ICU',       'Available'),
('212', 'ICU',       'Available'),
('213', 'ICU',       'Available'),
('214', 'ICU',       'Available'),
('215', 'ICU',       'Available'),
('216', 'ICU',       'Available'),
('217', 'ICU',       'Available'),
('218', 'ICU',       'Available'),
('219', 'ICU',       'Available'),
('220', 'ICU',       'Available');
