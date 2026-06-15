import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const greetingFor = (hour: number): string => {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Late shift';
};

const PawSilhouette = () => (
  <svg viewBox="0 0 200 200" aria-hidden className="h-full w-full" fill="currentColor">
    <ellipse cx="100" cy="128" rx="46" ry="40" />
    <ellipse cx="56" cy="74" rx="16" ry="22" transform="rotate(-18 56 74)" />
    <ellipse cx="88" cy="52" rx="16" ry="24" transform="rotate(-6 88 52)" />
    <ellipse cx="124" cy="52" rx="16" ry="24" transform="rotate(6 124 52)" />
    <ellipse cx="156" cy="74" rx="16" ry="22" transform="rotate(18 156 74)" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" />
  </svg>
);

const DropletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M11 20A7 7 0 0 0 9.8 6.9C15.5 4.9 20 2 20 2s-1.2 5-4.5 9c-1.8 2.2-4 4.1-4.5 9z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ICareCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const careCards: ICareCard[] = [
  {
    title: 'Regular Checkups',
    description: 'Annual wellness exams help catch problems early. Keep your pet on a consistent schedule for the best preventive care.',
    icon: <HeartIcon />,
  },
  {
    title: 'Vaccinations',
    description: 'Stay up-to-date with core vaccines. They protect your pet from serious diseases and keep the whole community safer.',
    icon: <ShieldIcon />,
  },
  {
    title: 'Nutrition & Diet',
    description: 'A balanced diet is the foundation of good health. Ask our vets about the right food and portions for your pet\'s breed and age.',
    icon: <LeafIcon />,
  },
  {
    title: 'Exercise & Play',
    description: 'Daily activity keeps pets physically fit and mentally stimulated. Even 15 minutes of play can make a big difference.',
    icon: <SunIcon />,
  },
  {
    title: 'Dental Health',
    description: 'Dental disease affects most pets by age 3. Regular brushing and professional cleanings prevent pain and infection.',
    icon: <DropletIcon />,
  },
  {
    title: 'Know the Signs',
    description: 'Changes in appetite, energy, or behavior can signal health issues. When in doubt, book a visit — early action saves lives.',
    icon: <ClockIcon />,
  },
];

interface IFunFact {
  fact: string;
  source: string;
}

const funFacts: IFunFact[] = [
  { fact: 'A dog\'s nose print is unique, much like a human fingerprint.', source: 'Animal science' },
  { fact: 'Cats spend 70% of their lives sleeping — about 13-16 hours a day.', source: 'Feline behavior' },
  { fact: 'Rabbits can\'t vomit, which makes diet incredibly important for them.', source: 'Exotic pet care' },
  { fact: 'A group of kittens is called a "kindle" and a group of cats is a "clowder."', source: 'Fun language' },
  { fact: 'Dogs can understand up to 250 words and gestures, about the level of a 2-year-old.', source: 'Canine cognition' },
  { fact: 'Parrots can live for over 80 years — some outlive their owners.', source: 'Avian lifespans' },
];

const UserHomePage = () => {
  const { user } = useAuth();
  const greeting = greetingFor(new Date().getHours());
  const name = user?.username ?? 'friend';

  const randomFact = funFacts[Math.floor(Date.now() / 86400000) % funFacts.length];

  return (
    <div className="text-spring-brown">
      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-spring-brown/15 bg-paper px-6 py-14 shadow-[0_30px_60px_-30px_rgba(52,48,45,0.25)] sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(52,48,45,0.10)_1px,transparent_0)] [background-size:14px_14px] opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-paper-deep/50 to-paper-deep/80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 h-[340px] w-[340px] text-spring-green/30 sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px] [animation:welcome-drift_14s_ease-in-out_infinite]"
        >
          <PawSilhouette />
        </div>

        <div className="relative max-w-3xl">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-spring-dark-green opacity-0 [animation:welcome-rise_700ms_ease-out_forwards]">
            <span aria-hidden className="inline-block h-px w-10 bg-spring-dark-green" />
            Spring PetClinic · Your Pet's Home
          </p>

          <h1
            className="mt-7 font-serif text-[2.75rem] leading-[1.02] tracking-tight text-spring-brown opacity-0 [animation:welcome-rise_700ms_ease-out_120ms_forwards] sm:text-6xl lg:text-[5.25rem]"
            style={{ fontVariationSettings: "'opsz' 96" }}
          >
            {greeting},
            <br />
            <span className="italic font-medium text-spring-dark-green">{name}</span>
            <span className="text-spring-green">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-spring-brown/80 opacity-0 [animation:welcome-rise_700ms_ease-out_240ms_forwards]">
            Your furry friends deserve the best. Check on your pets, schedule visits,
            and discover tips to keep them happy and healthy all year round.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 opacity-0 [animation:welcome-rise_700ms_ease-out_360ms_forwards]">
            <Link
              to="/my-pets"
              className="group inline-flex items-center gap-3 rounded-full bg-spring-brown px-7 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition-colors hover:bg-spring-dark-green focus:bg-spring-dark-green focus:outline-none"
            >
              View my pets
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/vets"
              className="group inline-flex items-center gap-3 rounded-full border border-spring-brown/40 bg-transparent px-7 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-spring-brown transition-colors hover:border-spring-dark-green hover:text-spring-dark-green focus:border-spring-dark-green focus:outline-none"
            >
              Meet our veterinarians
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────  PET CARE TIPS  ───────────────────────── */}
      <section className="mt-16 sm:mt-20">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 className="font-serif text-3xl tracking-tight text-spring-brown sm:text-4xl">
            Caring for your companion
          </h2>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-spring-grey sm:inline">
            ¶ essentials
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {careCards.map((card) => (
            <li key={card.title}>
              <div className="group relative flex h-full flex-col gap-4 overflow-hidden border-2 border-spring-brown bg-paper p-7 transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--color-spring-green)]">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-xl leading-tight text-spring-brown">
                    {card.title}
                  </h3>
                  <span className="h-8 w-8 shrink-0 text-spring-dark-green transition-transform duration-300 group-hover:rotate-[-8deg]">
                    {card.icon}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-spring-brown/70">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ─────────────────────────  FUN FACT + CTA  ───────────────────────── */}
      <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-spring-dark-green">
            <span aria-hidden className="inline-block h-px w-8 bg-spring-dark-green" />
            Did you know?
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tight text-spring-brown sm:text-5xl">
            Today's
            <br />
            <span className="italic text-spring-dark-green">pet fact.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-spring-brown/75">
            {randomFact.fact}
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-spring-grey">
            — {randomFact.source}
          </p>
        </div>

        <div className="relative lg:col-span-3">
          <div className="relative border-2 border-spring-brown bg-paper">
            <div
              aria-hidden
              className="absolute inset-x-0 -top-px h-1 bg-[repeating-linear-gradient(to_right,var(--color-spring-brown)_0_6px,transparent_6px_12px)]"
            />
            <div className="flex items-center justify-between border-b border-dashed border-spring-brown/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-spring-green" />
                <span className="font-display text-xs uppercase tracking-[0.22em] text-spring-brown">
                  Quick Links
                </span>
              </div>
            </div>

            <div className="divide-y divide-dashed divide-spring-brown/30">
              <Link to="/my-pets" className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-paper-deep">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-spring-brown/20 text-spring-dark-green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor" aria-hidden>
                    <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5 .3-86.2 32.6-96.8 70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3 29.1 51.7 10.2 84.1-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5 46.9 53.9 32.6 96.8-52.1 69.1-84.4 58.5z" />
                  </svg>
                </span>
                <div>
                  <span className="font-serif text-lg text-spring-brown">My Pets</span>
                  <p className="text-sm text-spring-brown/60">View and manage your pets and visits</p>
                </div>
                <span aria-hidden className="ml-auto text-spring-dark-green">→</span>
              </Link>

              <Link to="/vets" className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-paper-deep">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-spring-brown/20 text-spring-dark-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18" aria-hidden>
                    <path d="M6 3v6a4 4 0 0 0 8 0V3" strokeLinecap="round" />
                    <path d="M10 13v2.5A4.5 4.5 0 0 0 14.5 20h0A4.5 4.5 0 0 0 19 15.5V13" strokeLinecap="round" />
                    <circle cx="19" cy="11" r="2" />
                  </svg>
                </span>
                <div>
                  <span className="font-serif text-lg text-spring-brown">Our Veterinarians</span>
                  <p className="text-sm text-spring-brown/60">Meet the team and their specialties</p>
                </div>
                <span aria-hidden className="ml-auto text-spring-dark-green">→</span>
              </Link>

              <Link to="/profile" className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-paper-deep">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-spring-brown/20 text-spring-dark-green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                  </svg>
                </span>
                <div>
                  <span className="font-serif text-lg text-spring-brown">My Profile</span>
                  <p className="text-sm text-spring-brown/60">Update your email and password</p>
                </div>
                <span aria-hidden className="ml-auto text-spring-dark-green">→</span>
              </Link>
            </div>

            <div
              aria-hidden
              className="absolute inset-x-0 -bottom-px h-1 bg-[repeating-linear-gradient(to_right,var(--color-spring-brown)_0_6px,transparent_6px_12px)]"
            />
          </div>

          <div
            aria-hidden
            className="absolute -right-3 -top-5 hidden rotate-[8deg] border-2 border-spring-dark-green bg-paper px-3 py-1 font-display text-[10px] uppercase tracking-[0.22em] text-spring-dark-green shadow-[3px_3px_0_0_rgba(95,161,52,0.25)] sm:block"
          >
            Your hub
          </div>
        </div>
      </section>

      {/* ─────────────────────────  CLOSING  ───────────────────────── */}
      <section className="mt-20 border-t border-spring-brown/15 pt-12">
        <p className="max-w-3xl font-serif text-2xl leading-snug text-spring-brown/70 sm:text-3xl">
          <span aria-hidden className="mr-1 align-top font-serif text-4xl italic text-spring-dark-green">
            "
          </span>
          Every pet deserves a lifetime of belly rubs, sunny naps,
          <span className="italic text-spring-dark-green"> and the very best care we can give.</span>
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-spring-grey">
          — the spring petclinic team
        </p>
      </section>
    </div>
  );
};

export default UserHomePage;
