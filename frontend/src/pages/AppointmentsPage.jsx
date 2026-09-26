import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle, Clock3, Pencil, Plus, Search, XCircle } from 'lucide-react';
import Avatar from '../components/Avatar';

const EMPTY_FORM = {
  patient_name: '',
  patient_phone: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: ''
};
const EMPTY_EDIT_FORM = {
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
  status: 'Scheduled'
};
const APPOINTMENT_STATUSES = ['All', 'Upcoming', 'Completed', 'Cancelled'];
const EDITABLE_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];
const APPOINTMENT_TIME_SLOTS = Array.from({ length: 33 }, (_, index) => {
  const minutesSinceOpening = (9 * 60) + (index * 15);
  const hour = String(Math.floor(minutesSinceOpening / 60)).padStart(2, '0');
  const minute = String(minutesSinceOpening % 60).padStart(2, '0');
  return `${hour}:${minute}`;
});
const CLOCK_HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const CLOCK_MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const CLOCK_POSITIONS = [
  [50, 9], [70.5, 14.5], [85.5, 29.5], [91, 50],
  [85.5, 70.5], [70.5, 85.5], [50, 91], [29.5, 85.5],
  [14.5, 70.5], [9, 50], [14.5, 29.5], [29.5, 14.5]
];

const localToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const localDateTime = (date, time) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const formatAppointmentDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return date || '—';
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
};

const formatTime = (time) => {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return 'Select a time';
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
};

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
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState('book');
  const [clockMode, setClockMode] = useState('hours');
  const [pickerHour, setPickerHour] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState('AM');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const role = (localStorage.getItem('role') || '').toLowerCase();
  const canBook = ['admin', 'receptionist'].includes(role);
  const isSearching = Boolean(searchInput.trim());
  const filteredAppointments = appointments.filter((appointment) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query || appointment.patient_name?.toLowerCase().includes(query) ||
      appointment.doctor_name?.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === 'All' ||
      (selectedStatus === 'Upcoming' ? appointment.status === 'Scheduled' : appointment.status === selectedStatus);
    return matchesSearch && matchesStatus;
  });
  const phoneError = !/^\d{10}$/.test(formData.patient_phone)
    ? 'Phone number must be exactly 10 digits'
    : '';
  const selectedDoctor = doctors.find((doctor) => String(doctor.doctor_id) === String(formData.doctor_id));

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

  const isAllowedPickerTime = (hour, minute, period) => {
    const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    const time = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const selectedDate = timePickerTarget === 'edit' ? editForm.appointment_date : formData.appointment_date;
    const isPastTimeToday = selectedDate === localToday() && localDateTime(selectedDate, time) <= new Date();
    return APPOINTMENT_TIME_SLOTS.includes(time) && !isPastTimeToday;
  };

  const isAllowedPickerHour = (hour, period) => {
    const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    return APPOINTMENT_TIME_SLOTS.some((time) => {
      const [slotHour, slotMinute] = time.split(':').map(Number);
      return slotHour === hour24 && isAllowedPickerTime(hour, slotMinute, period);
    });
  };

  const openTimePicker = (target = 'book') => {
    const appointmentTime = target === 'edit' ? editForm.appointment_time : formData.appointment_time;
    const [hour = 9, minute = 0] = /^\d{2}:\d{2}$/.test(appointmentTime)
      ? appointmentTime.split(':').map(Number)
      : [];
    setPickerPeriod(hour >= 12 ? 'PM' : 'AM');
    setPickerHour(hour % 12 || 12);
    setPickerMinute(minute);
    setClockMode('hours');
    setTimePickerTarget(target);
    setTimePickerOpen(true);
  };

  const selectHour = (hour) => {
    if (!isAllowedPickerHour(hour, pickerPeriod)) return;
    setPickerHour(hour);
    if (hour === 5 && pickerPeriod === 'PM') setPickerMinute(0);
    setClockMode('minutes');
  };

  const selectMinute = (minute) => {
    if (!isAllowedPickerTime(pickerHour, minute, pickerPeriod)) return;
    setPickerMinute(minute);
  };

  const saveTime = () => {
    if (!isAllowedPickerTime(pickerHour, pickerMinute, pickerPeriod)) {
      notify('Choose a time between 09:00 AM and 05:00 PM.', 'error');
      return;
    }
    const hour24 = (pickerHour % 12) + (pickerPeriod === 'PM' ? 12 : 0);
    const appointmentTime = `${String(hour24).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`;
    if (timePickerTarget === 'edit') {
      setEditForm((current) => ({ ...current, appointment_time: appointmentTime }));
    } else {
      setFormData((current) => ({ ...current, appointment_time: appointmentTime }));
    }
    setTimePickerOpen(false);
  };

  const handleBook = async (event) => {
    event.preventDefault();
    setPhoneTouched(true);
    if (formData.patient_phone.length !== 10) {
      notify('Phone number must be exactly 10 digits', 'error');
      return;
    }

    if (!APPOINTMENT_TIME_SLOTS.includes(formData.appointment_time)) {
      notify('Please choose an available appointment time.', 'error');
      return;
    }

    if (localDateTime(formData.appointment_date, formData.appointment_time) <= new Date()) {
      notify('Cannot book an appointment in the past.', 'error');
      return;
    }

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

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      doctor_id: String(appointment.doctor_id || ''),
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
      reason: appointment.reason || '',
      status: appointment.status || 'Scheduled'
    });
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingAppointment(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    if (!editingAppointment) return;

    if (!editForm.doctor_id || !editForm.appointment_date || !editForm.appointment_time) {
      notify('Doctor, date, and time are required.', 'error');
      return;
    }
    if (editForm.appointment_date < localToday()) {
      notify(`Appointment date cannot be before ${localToday()}.`, 'error');
      return;
    }
    if (!APPOINTMENT_TIME_SLOTS.includes(editForm.appointment_time)) {
      notify('Please choose an available appointment time.', 'error');
      return;
    }
    if (localDateTime(editForm.appointment_date, editForm.appointment_time) <= new Date()) {
      notify('Cannot save an appointment in the past. Choose a later time.', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`/appointments/${editingAppointment.appointment_id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editForm)
      });
      const updatedAppointment = await response.json();
      if (!response.ok) throw new Error(updatedAppointment.message || 'Unable to save appointment changes.');

      setAppointments((currentAppointments) => currentAppointments.map((appointment) =>
        appointment.appointment_id === editingAppointment.appointment_id
          ? {
              ...appointment,
              ...updatedAppointment,
              doctor_name: doctors.find((doctor) => String(doctor.doctor_id) === String(updatedAppointment.doctor_id))?.name || appointment.doctor_name
            }
          : appointment
      ));
      setEditingAppointment(null);
      setEditForm(EMPTY_EDIT_FORM);
      notify('Appointment updated successfully.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch(`/appointments/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      const updatedAppointment = await response.json();
      if (!response.ok) throw new Error(updatedAppointment.message || 'Unable to update appointment status.');

      setAppointments((currentAppointments) => currentAppointments.map((appointment) =>
        appointment.appointment_id === id
          ? { ...appointment, status: updatedAppointment.status }
          : appointment
      ));
      notify(`Appointment marked as ${updatedAppointment.status}.`);
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const handleCancel = (id) => {
    updateAppointmentStatus(id, 'Cancelled');
  };

  const handleMarkCompleted = (id) => {
    updateAppointmentStatus(id, 'Completed');
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

      {canBook && !isSearching && (
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2"><CalendarDays size={20} aria-hidden="true" /> <span>Book Appointment</span></h2>
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
                    minLength={10}
                    pattern="[0-9]{10}"
                    required
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
                  {selectedDoctor && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-gray)' }}><Avatar name={selectedDoctor.name} size="sm" />{selectedDoctor.name}</div>}
                  {doctorsLoadError && (
                    <p className="help-text" style={{ color: 'var(--danger)' }} role="alert">
                      Could not load doctors: {doctorsLoadError}
                    </p>
                  )}
                </div>
                <div className="input-group">
                  <label>Date *</label>
                  <input className="form-control" name="appointment_date" value={formData.appointment_date} onChange={handleChange} type="date" min={localToday()} required />
                </div>
                <div className="input-group">
                  <label>Time *</label>
                  <button className="time-input-trigger" type="button" onClick={openTimePicker} aria-haspopup="dialog" aria-expanded={timePickerOpen && timePickerTarget === 'book'}>
                    <Clock3 size={18} aria-hidden="true" />
                    <span className={formData.appointment_time ? '' : 'time-placeholder'}>{formatTime(formData.appointment_time)}</span>
                  </button>
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
          <table className="table appointments-table">
            <thead>
              <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredAppointments.length ? filteredAppointments.map((appointment) => (
                <tr key={appointment.appointment_id}>
                  <td>#{appointment.appointment_id}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={appointment.patient_name} size="sm" /><div><strong>{appointment.patient_name}</strong><br /><span className="help-text">{appointment.patient_phone || 'No phone'}</span></div></div></td>
                  <td>{appointment.doctor_name ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={appointment.doctor_name} size="sm" />{appointment.doctor_name}</div> : 'Unassigned'}</td>
                  <td className="whitespace-nowrap"><span className="whitespace-nowrap">{formatAppointmentDate(appointment.appointment_date)}</span></td>
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.reason || '—'}</td>
                  <td><span className={`badge ${statusClass(appointment.status)}`}>{appointment.status}</span></td>
                  <td>
                    <div className="appointment-actions">
                      <button className="btn btn-outline" type="button" onClick={() => handleEdit(appointment)} aria-label={`Edit appointment ${appointment.appointment_id}`}><Pencil size={14} /> Edit</button>
                      <button className="btn btn-danger" type="button" onClick={() => handleCancel(appointment.appointment_id)} disabled={appointment.status === 'Completed' || appointment.status === 'Cancelled'} aria-label={`Cancel appointment ${appointment.appointment_id}`}><XCircle size={14} /> Cancel</button>
                      <button className="btn btn-outline" type="button" onClick={() => handleMarkCompleted(appointment.appointment_id)} disabled={appointment.status === 'Completed' || appointment.status === 'Cancelled'} aria-label={`Mark appointment ${appointment.appointment_id} completed`}><CheckCircle size={14} /> Mark Completed</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-0">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <img src="/empty_state_medical.png" alt="No appointment records" className="w-48" />
                      <h3 className="mt-4 text-lg font-semibold text-slate-700">No records found</h3>
                      <p className="mt-1 text-sm text-slate-500">There are no appointments matching your current filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingAppointment && (
        <div className="appointment-edit-overlay" role="presentation" onMouseDown={closeEditModal}>
          <div className="appointment-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-appointment-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="appointment-edit-header">
              <div>
                <p className="appointment-edit-eyebrow">Appointment #{editingAppointment.appointment_id}</p>
                <h2 id="edit-appointment-title">Edit appointment</h2>
                <p>Update the visit details for {editingAppointment.patient_name}.</p>
              </div>
              <button className="appointment-edit-close" type="button" onClick={closeEditModal} aria-label="Close edit appointment modal">×</button>
            </div>
            <form onSubmit={handleSaveChanges}>
              <div className="form-grid appointment-edit-grid">
                <div className="input-group">
                  <label htmlFor="edit-doctor">Doctor *</label>
                  <select id="edit-doctor" className="form-control" name="doctor_id" value={editForm.doctor_id} onChange={handleEditChange} required>
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => <option key={doctor.doctor_id} value={doctor.doctor_id}>{doctor.name} — {doctor.specialization}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="edit-date">Date *</label>
                  <input id="edit-date" className="form-control" name="appointment_date" value={editForm.appointment_date} onChange={handleEditChange} type="date" min={localToday()} required />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-time">Time *</label>
                  <button id="edit-time" className="time-input-trigger" type="button" onClick={() => openTimePicker('edit')} aria-haspopup="dialog" aria-expanded={timePickerOpen && timePickerTarget === 'edit'}>
                    <Clock3 size={18} aria-hidden="true" />
                    <span className={editForm.appointment_time ? '' : 'time-placeholder'}>{formatTime(editForm.appointment_time)}</span>
                  </button>
                </div>
                <div className="input-group">
                  <label htmlFor="edit-status">Status *</label>
                  <select id="edit-status" className="form-control" name="status" value={editForm.status} onChange={handleEditChange} required>
                    {EDITABLE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="input-group appointment-edit-reason">
                  <label htmlFor="edit-reason">Reason</label>
                  <textarea id="edit-reason" className="form-control" name="reason" value={editForm.reason} onChange={handleEditChange} placeholder="Reason for visit" rows="3" />
                </div>
              </div>
              <div className="appointment-edit-actions">
                <button className="btn btn-outline" type="button" onClick={closeEditModal} disabled={savingEdit}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {timePickerOpen && (
        <div className="clock-picker-overlay" role="presentation" onClick={() => setTimePickerOpen(false)}>
          <div className="clock-picker-modal" role="dialog" aria-modal="true" aria-label="Select appointment time" onClick={(event) => event.stopPropagation()}>
            <div className="clock-picker-header">
              <button type="button" className={clockMode === 'hours' ? 'clock-header-value active' : 'clock-header-value'} onClick={() => setClockMode('hours')}>
                {pickerHour}
              </button>
              <span>:</span>
              <button type="button" className={clockMode === 'minutes' ? 'clock-header-value active' : 'clock-header-value'} onClick={() => setClockMode('minutes')}>
                {String(pickerMinute).padStart(2, '0')}
              </button>
              <div className="clock-period-toggle" aria-label="AM or PM">
                {['AM', 'PM'].map((period) => (
                  <button key={period} type="button" className={pickerPeriod === period ? 'active' : ''} onClick={() => setPickerPeriod(period)}>{period}</button>
                ))}
              </div>
            </div>

            <div className="clock-dial" role="group" aria-label={clockMode === 'hours' ? 'Select an appointment hour' : 'Select appointment minutes'}>
              <span className="clock-dial-center" />
              {(clockMode === 'hours' ? CLOCK_HOURS : CLOCK_MINUTES).map((value, index) => {
                const isSelected = clockMode === 'hours' ? pickerHour === value : pickerMinute === value;
                const isAvailable = clockMode === 'hours'
                  ? isAllowedPickerHour(value, pickerPeriod)
                  : isAllowedPickerTime(pickerHour, value, pickerPeriod);
                const [left, top] = CLOCK_POSITIONS[index];
                return (
                  <button
                    key={value}
                    type="button"
                    className={`clock-dial-option${isSelected ? ' selected' : ''}${isAvailable ? '' : ' unavailable text-slate-300 cursor-not-allowed'}`}
                    style={{ '--clock-x': `${left}%`, '--clock-y': `${top}%` }}
                    onClick={() => clockMode === 'hours' ? selectHour(value) : selectMinute(value)}
                    aria-label={clockMode === 'hours' ? `${value} o'clock` : `${String(value).padStart(2, '0')} minutes`}
                    disabled={!isAvailable}
                  >
                    {clockMode === 'hours' ? value : String(value).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="clock-picker-actions">
              <button type="button" onClick={() => { if (timePickerTarget === 'edit') setEditForm((current) => ({ ...current, appointment_time: '' })); else setFormData((current) => ({ ...current, appointment_time: '' })); setTimePickerOpen(false); }}>Clear</button>
              <button type="button" onClick={() => setTimePickerOpen(false)}>Cancel</button>
              <button type="button" className="clock-set-button" onClick={saveTime}>Set</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentsPage;
