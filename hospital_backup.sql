UPDATE doctors
SET
phone = CONCAT('+91 90000', LPAD(doctor_id, 5, '0')),
email = CONCAT('doctor', doctor_id, '@smarthospital.com')
WHERE doctor_id > 0;