import { CalendarDays, Moon, Sun } from 'lucide-react';

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getGreetingIcon = (hour) => {
  if (hour < 12) return Sun;
  if (hour < 18) return CalendarDays;
  return Moon;
};

export default function WelcomeBanner() {
  const name = localStorage.getItem('userName')?.trim() || 'there';
  const hour = new Date().getHours();
  const GreetingIcon = getGreetingIcon(hour);

  return (
    <section
      className="welcome-banner"
      aria-label="Welcome message"
    >
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-800">
          {getGreeting(hour)}, {name}!
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Here is what&apos;s happening at the hospital today.
        </p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500" aria-hidden="true">
        <GreetingIcon size={24} strokeWidth={1.8} />
      </div>
    </section>
  );
}
