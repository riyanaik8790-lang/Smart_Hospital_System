import { useEffect, useState } from 'react';

const readIdentity = () => ({
  name: localStorage.getItem('userName')?.trim() || 'there',
  role: localStorage.getItem('role')?.trim().toLowerCase() || 'staff'
});

const formatRole = (role) => role ? `${role[0].toUpperCase()}${role.slice(1)}` : 'Staff';

export default function PageGreeting() {
  const [identity, setIdentity] = useState(readIdentity);

  useEffect(() => {
    const refreshIdentity = () => setIdentity(readIdentity());
    window.addEventListener('profile-updated', refreshIdentity);
    window.addEventListener('storage', refreshIdentity);
    return () => {
      window.removeEventListener('profile-updated', refreshIdentity);
      window.removeEventListener('storage', refreshIdentity);
    };
  }, []);

  const role = formatRole(identity.role);
  const greeting = identity.role === 'doctor'
    ? `Welcome, Dr. ${identity.name}`
    : identity.role === 'nurse'
      ? `Welcome back, Nurse ${identity.name}`
      : identity.role === 'receptionist'
        ? `Good day, ${identity.name} · Reception`
        : `Welcome back, ${role} ${identity.name}`;
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <section className="page-greeting" aria-label="Staff greeting">
      <p className="page-greeting-title">{greeting}</p>
      <p className="page-greeting-subtitle">{date} · Here&apos;s your hospital workspace.</p>
    </section>
  );
}
