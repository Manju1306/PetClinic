import { z } from 'zod';
import { tool } from 'ai';
import { Vet, Specialty, Pet, PetType, Visit, Owner } from '../db';

// ── What are "tools"? ───────────────────────────────────────────────────
//
// Tools are functions we expose to the AI model. The AI sees the name,
// description, and input schema of each tool. When a user asks
// "which vet handles cats?", the AI decides to call `search_vets` with
// the right parameters. We execute the function, return the database
// results, and the AI weaves them into a natural-language answer.
//
// This is the same concept as MCP (Model Context Protocol) tools —
// giving an AI structured access to external data and actions.

export function createPetClinicTools(username: string, roles: string[] = []) {
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_OWNER_ADMIN');

  return {

    list_specialties: tool({
      description: 'List all veterinary specialties available at the clinic (e.g. radiology, surgery, dentistry)',
      inputSchema: z.object({}),
      execute: async () => {
        const specialties = await Specialty.findAll({ order: [['name', 'ASC']] });
        return specialties.map(s => ({ id: s.id, name: s.name }));
      },
    }),

    search_vets: tool({
      description:
        'Search veterinarians. Can filter by specialty name (e.g. "surgery", "radiology") ' +
        'or vet name. Returns vet details with their specialties. ' +
        'Use this when users ask about available vets, who handles emergencies, ' +
        'or which vet is best for a specific condition.',
      inputSchema: z.object({
        specialty: z.string().optional().describe('Filter by specialty name (partial match)'),
        name: z.string().optional().describe('Filter by vet first or last name (partial match)'),
      }),
      execute: async ({ specialty, name }: { specialty?: string; name?: string }) => {
        const include = [{ model: Specialty, as: 'specialties', through: { attributes: [] } }];
        let vets = await Vet.findAll({ include, order: [['last_name', 'ASC']] });

        if (specialty) {
          const lower = specialty.toLowerCase();
          vets = vets.filter(v =>
            v.specialties?.some(s => s.name?.toLowerCase().includes(lower))
          );
        }
        if (name) {
          const lower = name.toLowerCase();
          vets = vets.filter(v =>
            v.first_name?.toLowerCase().includes(lower) ||
            v.last_name?.toLowerCase().includes(lower)
          );
        }

        return vets.map(v => ({
          id: v.id,
          name: `Dr. ${v.first_name} ${v.last_name}`,
          specialties: v.specialties?.map(s => s.name) ?? [],
        }));
      },
    }),

    get_my_pets: tool({
      description:
        'Get pets. For regular users, returns their own pets. ' +
        'For admin users: call with no arguments to list ALL owners and their pets, ' +
        'or pass ownerName to filter by a specific owner. ' +
        'Always call this tool when asked about pets, owners, or who has how many pets.',
      inputSchema: z.object({
        ownerName: z.string().optional().describe('Filter by owner name (partial match on first or last name). Omit to get all owners (admin) or own pets (regular user).'),
      }),
      execute: async ({ ownerName }: { ownerName?: string }) => {
        if (isAdmin && ownerName) {
          const owners = await Owner.findAll({
            where: {},
            include: [{
              model: Pet,
              as: 'pets',
              include: [{ model: PetType, as: 'type' }],
            }],
          });
          const lower = ownerName.toLowerCase();
          const filtered = owners.filter(o =>
            o.first_name?.toLowerCase().includes(lower) ||
            o.last_name?.toLowerCase().includes(lower),
          );
          if (filtered.length === 0) return { message: `No owners found matching "${ownerName}".` };
          return filtered.map(o => ({
            owner: { id: o.id, name: `${o.first_name} ${o.last_name}` },
            pets: o.pets?.map(p => ({
              id: p.id, name: p.name, type: p.type?.name ?? 'unknown',
              birthDate: p.birth_date, ownerId: o.id,
            })) ?? [],
          }));
        }

        if (isAdmin && !ownerName) {
          const owners = await Owner.findAll({
            include: [{
              model: Pet,
              as: 'pets',
              include: [{ model: PetType, as: 'type' }],
            }],
          });
          return owners.map(o => ({
            owner: { id: o.id, name: `${o.first_name} ${o.last_name}` },
            petCount: o.pets?.length ?? 0,
            pets: o.pets?.map(p => ({
              id: p.id, name: p.name, type: p.type?.name ?? 'unknown',
              birthDate: p.birth_date,
            })) ?? [],
          }));
        }

        const owner = await Owner.findOne({
          where: { username },
          include: [{
            model: Pet,
            as: 'pets',
            include: [{ model: PetType, as: 'type' }],
          }],
        });

        if (!owner) {
          return { message: 'No owner profile is linked to your account. Please ask an admin to set up your owner profile.' };
        }

        return {
          owner: { id: owner.id, name: `${owner.first_name} ${owner.last_name}` },
          pets: owner.pets?.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type?.name ?? 'unknown',
            birthDate: p.birth_date,
            ownerId: owner.id,
          })) ?? [],
        };
      },
    }),

    get_pet_visits: tool({
      description:
        'Get visit history for a specific pet by pet ID. Returns dates and descriptions. ' +
        'Use get_my_pets first to find the pet ID, then call this.',
      inputSchema: z.object({
        petId: z.number().describe('The pet ID to look up visits for'),
      }),
      execute: async ({ petId }: { petId: number }) => {
        const pet = await Pet.findByPk(petId, {
          include: [
            { model: PetType, as: 'type' },
            { model: Visit, as: 'visits' },
            { model: Owner, as: 'owner' },
          ],
        });

        if (!pet) return { error: 'Pet not found' };

        if (!isAdmin && pet.owner?.username !== username) {
          return { error: 'You can only view visits for your own pets' };
        }

        return {
          pet: { id: pet.id, name: pet.name, type: pet.type?.name },
          visits: pet.visits?.map(v => ({
            id: v.id,
            date: v.visit_date,
            description: v.description,
          })) ?? [],
        };
      },
    }),

    add_visit: tool({
      description:
        'Book a new veterinary visit for a pet. Requires the pet ID, visit date, and ' +
        'a description of why the visit is needed. Only works for pets owned by the ' +
        'current user. Always confirm with the user before calling this.',
      inputSchema: z.object({
        petId: z.number().describe('The pet ID to book the visit for'),
        date: z.string().describe('Visit date in YYYY-MM-DD format'),
        description: z.string().describe('Reason for the visit'),
      }),
      execute: async ({ petId, date, description }: { petId: number; date: string; description: string }) => {
        const pet = await Pet.findByPk(petId, {
          include: [{ model: Owner, as: 'owner' }],
        });

        if (!pet) return { error: 'Pet not found' };
        if (!isAdmin && pet.owner?.username !== username) {
          return { error: 'You can only book visits for your own pets' };
        }

        const visit = await Visit.create({
          pet_id: petId,
          visit_date: date,
          description,
        });

        return {
          success: true,
          visit: { id: visit.id, date: visit.visit_date, description: visit.description },
          message: `Visit booked for ${pet.name} on ${date}`,
        };
      },
    }),

    list_pet_types: tool({
      description: 'List all pet types the clinic supports (dog, cat, bird, etc.)',
      inputSchema: z.object({}),
      execute: async () => {
        const types = await PetType.findAll({ order: [['name', 'ASC']] });
        return types.map(t => ({ id: t.id, name: t.name }));
      },
    }),
  };
}
