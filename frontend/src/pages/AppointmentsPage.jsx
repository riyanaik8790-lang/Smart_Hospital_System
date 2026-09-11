import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle, Plus, Search, XCircle } from 'lucide-react';

const EMPTY_FORM = {
  patient_name: '',
  patient_phone: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: ''
};
const APPOINTMENT_STATUSES = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
});

const statusClass = (status) => {
  if (status === 'Completed') return 'badge-low';
  if (status === 'Scheduled') return 'badge-medium';
  return 'badge-high';
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoadError, setDoctorsLoadError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const role = (localStorage.getItem('role') || '').toLowerCase();
  const canBook = ['admin', 'receptionist'].includes(role);
  const canUpdate = ['admin', 'doctor'].includes(role);
  const filteredAppointments = appointments.filter((appointment) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query || appointment.patient_name?.toLowerCase().includes(query) ||
      appointment.doctor_name?.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === 'All' ||
      (selectedStatus === 'Upcoming' ? appointment.status === 'Scheduled' : appointment.status === selectedStatus);
    return matchesSearch && matchesStatus;
  });
  const phoneError = formData.patient_phone && !/^\d{10}$/.test(formData.patient_phone)
    ? 'Phone number must be 10 digits'
    : '';

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 4000);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch('/appointments', { headers: authHeaders() });
      if (!response.ok) throw new Error('Could not load appointments');
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Appointment fetch error:', error);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await fetch('/doctors', { headers: authHeaders() });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
      if (!response.ok) {
        const message = typeof data === 'object' ? data.message : data;
        throw new Error(message || `Could not load doctors (HTTP ${response.status}).`);
      }
      if (!Array.isArray(data)) throw new Error('The server returned an invalid doctors response.');
      setDoctors(data);
      setDoctorsLoadError('');
    } catch (error) {
      const message = error.message || 'Unable to load doctors.';
      console.error('Doctor fetch error:', { message, error });
      setDoctorsLoadError(message);
      notify(message, 'error');
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    const interval = window.setInterval(fetchAppointments, 5000);
    return () => window.clearInterval(interval);
  }, [fetchAppointments, fetchDoctors]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'patient_phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;
    setFormData((current) => ({ ...current, [name]: nextValue }));
  };

  const handleBook = async (event) => {
    event.preventDefault();
    setPhoneTouched(true);
    if (phoneError) return;

    setLoading(true);
    try {
      const response = await fetch('/appointments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to book appointment.');
      setFormData(EMPTY_FORM);
      setPhoneTouched(false);
      notify('Appointment booked successfully.');
      fetchAppointments();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId, status) => {
    try {
      const response = await fetch(`/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update appointment.');
      notify(`Appointment marked ${status}.`);
      fetchAppointments();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const removeAppointment = async (appointmentId) => {
    if (!window.confirm('Remove this appointment?')) return;
    try {
      const response = await fetch(`/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to remove appointment.');
      notify('Appointment removed.');
      fetchAppointments();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Book and manage scheduled hospital visits</p>
        </div>
      </div>

      <div className="card mb-6" style={{ marginBottom: '24px' }}>
        <div className="filter-bar" style={{ display: 'flex', gap: '12px', padding: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-search" style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="search"
              placeholder="Search by patient or doctor..."
              className="form-control"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className="filter-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {APPOINTMENT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            style={{
              padding: '5px 12px', borderRadius: '20px', border: '1px solid',
              borderColor: selectedStatus === status ? 'var(--primary)' : 'var(--border)',
              background: selectedStatus === status ? 'var(--primary)' : 'white',
              color: selectedStatus === status ? 'white' : 'var(--text-gray)',
              cursor: 'pointer', fontSize: '12px', transition: '0.2s'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {canBook && (
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title"><CalendarDays size={20} /> Book Appointment</h2>
          </div>
          <div className="section-body">
            <form onSubmit={handleBook}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Patient Name *</label>
                  <input className="form-control" name="patient_name" value={formData.patient_name} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Patient Phone</label>
                  <input
                    className="form-control"
                    name="patient_phone"
                    value={formData.patient_phone}
                    onChange={handleChange}
                    onBlur={() => setPhoneTouched(true)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby="patient-phone-error"
                    style={{ borderColor: phoneTouched && phoneError ? 'var(--danger)' : undefined }}
                  />
                  {phoneTouched && phoneError && (
                    <p id="patient-phone-error" className="help-text" style={{ color: 'var(--danger)' }}>
                      {phoneError}
                    </p>
                  )}
                </div>
                <div className="input-group">
                  <label>Doctor *</label>
                  <select className="form-control" name="doctor_id" value={formData.doctor_id} onChange={handleChange} required>
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        {doctor.name} — {doctor.specialization}
                      </option>
                    ))}
                  </select>
                  {doctorsLoadError && (
                    <p className="help-text" style={{ color: 'var(--danger)' }} role="alert">
                      Could not load doctors: {doctorsLoadError}
                    </p>
                  )}
                </div>
                <div className="input-group">
                  <label>Date *</label>
                  <input className="form-control" name="appointment_date" value={formData.appointment_date} onChange={handleChange} type="date" required />
                </div>
                <div className="input-group">
                  <label>Time *</label>
                  <input className="form-control" name="appointment_time" value={formData.appointment_time} onChange={handleChange} type="time" required />
                </div>
                <div className="input-group">
                  <label>Reason</label>
                  <input className="form-control" name="reason" value={formData.reason} onChange={handleChange} placeholder="Reason for visit" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  <Plus size={18} /> {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">Scheduled Appointments</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredAppointments.length ? filteredAppointments.map((appointment) => (
                <tr key={appointment.appointment_id}>
                  <td>#{appointment.appointment_id}</td>
                  <td><strong>{appointment.patient_name}</strong><br /><span className="help-text">{appointment.patient_phone || 'No phone'}</span></td>
                  <td>{appointment.doctor_name || 'Unassigned'}</td>
                  <td>{appointment.appointment_date}</td>
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.reason || '—'}</td>
                  <td><span className={`badge ${statusClass(appointment.status)}`}>{appointment.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdate && appointment.status === 'Scheduled' && <>
                        <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => updateStatus(appointment.appointment_id, 'Completed')}>Complete</button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => updateStatus(appointment.appointment_id, 'Cancelled')}>Cancel</button>
                      </>}
                      {canBook && <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => removeAppointment(appointment.appointment_id)}><XCircle size={14} /> Remove</button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="text-center" style={{ padding: '32px', color: 'var(--text-gray)' }}>No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default AppointmentsPage;
