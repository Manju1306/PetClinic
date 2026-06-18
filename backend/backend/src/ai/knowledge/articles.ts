export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'pet-care' | 'clinic';
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  // ── Pet Care Articles ─────────────────────────────────────────
  {
    id: 'vaccination-dogs',
    title: 'Dog Vaccination Schedule',
    category: 'pet-care',
    content:
      'Puppies need a series of vaccinations starting at 6-8 weeks old. ' +
      'Core vaccines include Distemper, Parvovirus, Adenovirus, and Rabies. ' +
      'Puppies get boosters every 3-4 weeks until 16 weeks old. ' +
      'Adult dogs need boosters every 1-3 years depending on the vaccine. ' +
      'Rabies vaccination is required by law in most areas. ' +
      'Non-core vaccines like Bordetella (kennel cough) and Lyme disease ' +
      'are recommended based on lifestyle and exposure risk.',
  },
  {
    id: 'vaccination-cats',
    title: 'Cat Vaccination Schedule',
    category: 'pet-care',
    content:
      'Kittens should start vaccinations at 6-8 weeks old. ' +
      'Core vaccines for cats include Feline Panleukopenia (FPV), ' +
      'Feline Calicivirus (FCV), Feline Herpesvirus (FHV-1), and Rabies. ' +
      'Kittens need boosters every 3-4 weeks until 16 weeks. ' +
      'Indoor cats still need core vaccines. ' +
      'FeLV (Feline Leukemia) vaccine is recommended for outdoor cats. ' +
      'Adult cats need boosters every 1-3 years.',
  },
  {
    id: 'dental-care',
    title: 'Pet Dental Care Guide',
    category: 'pet-care',
    content:
      'Dental disease affects over 80% of dogs and 70% of cats by age 3. ' +
      'Signs of dental problems include bad breath, drooling, difficulty eating, ' +
      'swollen gums, loose teeth, and pawing at the mouth. ' +
      'Brush your pet\'s teeth daily with pet-specific toothpaste (never human toothpaste). ' +
      'Professional dental cleanings under anesthesia are recommended yearly. ' +
      'Dental chews and toys can help reduce plaque buildup. ' +
      'Untreated dental disease can lead to infections spreading to the heart, liver, and kidneys.',
  },
  {
    id: 'nutrition-dogs',
    title: 'Dog Nutrition Basics',
    category: 'pet-care',
    content:
      'Dogs need a balanced diet of proteins, fats, carbohydrates, vitamins, and minerals. ' +
      'Puppies need puppy-specific food with higher calories and nutrients for growth. ' +
      'Senior dogs (7+ years) benefit from senior formulas with joint support. ' +
      'Avoid feeding dogs chocolate, grapes, raisins, onions, garlic, and xylitol — these are toxic. ' +
      'Portion control is important — obesity is the most common nutritional problem in dogs. ' +
      'Fresh water should always be available. ' +
      'Consult your vet before switching to raw or homemade diets.',
  },
  {
    id: 'nutrition-cats',
    title: 'Cat Nutrition Basics',
    category: 'pet-care',
    content:
      'Cats are obligate carnivores and need high-protein, meat-based diets. ' +
      'Taurine is an essential amino acid for cats — deficiency causes heart and eye problems. ' +
      'Cats often don\'t drink enough water; wet food helps with hydration. ' +
      'Never feed cats dog food — it lacks essential nutrients cats need. ' +
      'Toxic foods for cats include onions, garlic, chocolate, alcohol, and lilies. ' +
      'Kittens need kitten-specific food until 12 months old. ' +
      'Overweight cats are at risk for diabetes, arthritis, and liver disease.',
  },
  {
    id: 'exercise-dogs',
    title: 'Dog Exercise Requirements',
    category: 'pet-care',
    content:
      'Most dogs need 30 minutes to 2 hours of exercise daily, depending on breed and age. ' +
      'High-energy breeds (Border Collies, Huskies, Retrievers) need 1-2 hours of vigorous exercise. ' +
      'Small breeds and senior dogs may need only 20-30 minutes of gentle walking. ' +
      'Puppies should have short, frequent play sessions — avoid long runs until joints mature (12-18 months). ' +
      'Signs of insufficient exercise include destructive behavior, excessive barking, and weight gain. ' +
      'Mental stimulation (puzzle toys, training) is as important as physical exercise. ' +
      'Avoid exercising dogs in extreme heat — they can overheat quickly.',
  },
  {
    id: 'parasites',
    title: 'Parasite Prevention for Pets',
    category: 'pet-care',
    content:
      'Common parasites include fleas, ticks, heartworms, and intestinal worms. ' +
      'Year-round prevention is recommended in most climates. ' +
      'Heartworm disease is transmitted by mosquitoes and is potentially fatal — prevention is a monthly medication. ' +
      'Fleas can cause allergic dermatitis, anemia, and transmit tapeworms. ' +
      'Ticks can transmit Lyme disease, Ehrlichiosis, and Rocky Mountain spotted fever. ' +
      'Intestinal worms (roundworms, hookworms, tapeworms) can be detected through fecal testing. ' +
      'Puppies and kittens should be dewormed starting at 2 weeks old.',
  },
  {
    id: 'spay-neuter',
    title: 'Spaying and Neutering',
    category: 'pet-care',
    content:
      'Spaying (females) and neutering (males) is recommended for most pets. ' +
      'Benefits include preventing unwanted litters, reducing cancer risk, ' +
      'and decreasing behavioral issues like roaming, marking, and aggression. ' +
      'Dogs are typically spayed/neutered at 6 months, though large breeds may benefit from waiting until 12-18 months. ' +
      'Cats can be spayed/neutered as early as 8 weeks old. ' +
      'The procedure is done under general anesthesia and recovery takes 10-14 days. ' +
      'Post-surgery: use an e-collar, limit activity, and monitor the incision site.',
  },
  {
    id: 'signs-emergency',
    title: 'Emergency Signs in Pets',
    category: 'pet-care',
    content:
      'Seek immediate veterinary care if your pet shows these signs: ' +
      'difficulty breathing, uncontrolled bleeding, inability to urinate, ' +
      'seizures lasting more than 3 minutes, collapse or unconsciousness, ' +
      'suspected poisoning (bring the substance packaging), ' +
      'bloated abdomen with restlessness (could be GDV/bloat in dogs — life-threatening), ' +
      'eye injuries, severe vomiting or diarrhea lasting more than 24 hours, ' +
      'broken bones or inability to walk, and heatstroke (heavy panting, drooling, bright red gums). ' +
      'Keep the pet calm during transport and call ahead to the emergency clinic.',
  },
  {
    id: 'senior-pets',
    title: 'Caring for Senior Pets',
    category: 'pet-care',
    content:
      'Dogs are considered senior at 7-10 years (varies by size — large breeds age faster). ' +
      'Cats are senior at around 11 years. ' +
      'Senior pets need twice-yearly veterinary checkups instead of annual visits. ' +
      'Common age-related issues include arthritis, dental disease, kidney disease, ' +
      'cognitive dysfunction, vision/hearing loss, and cancer. ' +
      'Adjust diet to senior formulas with joint support (glucosamine, omega-3s). ' +
      'Keep exercise gentle but consistent — short walks, swimming. ' +
      'Provide orthopedic bedding and easy access to food, water, and litter boxes. ' +
      'Watch for changes in appetite, weight, behavior, or litter box habits.',
  },

  // ── Clinic Information ────────────────────────────────────────
  {
    id: 'clinic-hours',
    title: 'Clinic Hours and Location',
    category: 'clinic',
    content:
      'Spring PetClinic is open Monday through Friday, 8:00 AM to 6:00 PM, ' +
      'and Saturday 9:00 AM to 2:00 PM. We are closed on Sundays and major holidays. ' +
      'For after-hours emergencies, please call our emergency line. ' +
      'We recommend scheduling appointments in advance, though walk-ins are accepted ' +
      'based on availability. New patient appointments are 45 minutes; follow-ups are 20 minutes.',
  },
  {
    id: 'clinic-services',
    title: 'Services Offered',
    category: 'clinic',
    content:
      'Spring PetClinic offers comprehensive veterinary care including: ' +
      'wellness exams and vaccinations, dental cleanings and oral surgery, ' +
      'spay/neuter surgery, diagnostic imaging (X-ray and ultrasound), ' +
      'laboratory testing (blood work, urinalysis, fecal testing), ' +
      'allergy testing and treatment, microchipping, ' +
      'nutrition counseling, behavioral consultations, ' +
      'senior pet wellness programs, and parasite prevention plans. ' +
      'We do not offer 24-hour emergency care — for emergencies outside clinic hours, ' +
      'please contact your nearest emergency animal hospital.',
  },
  {
    id: 'clinic-new-patient',
    title: 'New Patient Information',
    category: 'clinic',
    content:
      'Welcome to Spring PetClinic! For your first visit, please bring: ' +
      'previous veterinary records and vaccination history, ' +
      'a list of current medications and supplements, ' +
      'your pet on a leash or in a carrier (required for all cats). ' +
      'Arrive 10 minutes early to complete registration. ' +
      'Your first visit includes a comprehensive physical exam, ' +
      'a review of your pet\'s health history, and a customized care plan. ' +
      'We accept most pet insurance plans. Payment is due at time of service. ' +
      'We accept cash, credit/debit cards, and CareCredit.',
  },
  {
    id: 'clinic-pricing',
    title: 'Pricing Guide',
    category: 'clinic',
    content:
      'Wellness exam: $55-$75 depending on species. ' +
      'Vaccination packages: $85-$120 (core vaccines). ' +
      'Dental cleaning: $250-$450 (includes anesthesia and pre-anesthetic blood work). ' +
      'Spay surgery: $200-$350 (dogs), $150-$250 (cats). ' +
      'Neuter surgery: $150-$300 (dogs), $100-$200 (cats). ' +
      'Blood work panel: $80-$150. X-rays: $120-$250. ' +
      'Microchipping: $45 (includes registration). ' +
      'Prices are estimates and may vary based on pet size, age, and specific needs. ' +
      'We offer wellness plans for puppies, kittens, and senior pets that bundle ' +
      'routine care at a discounted rate.',
  },
];
