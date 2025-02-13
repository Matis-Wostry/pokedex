const pkmnService = require("../services/pkmnService");
const Pokemon = require("../models/Pokemon");

const getTypes = (req, res) => {
    const types = pkmnService.getAllTypes();
    res.json(types);
};

const createPokemon = async (req, res) => {
    try {
        const { name, types, regions, hp, attack, defense, specialAttack, specialDefense, speed, description, image } = req.body;

        // Vérifier si le Pokémon existe déjà
        const existingPokemon = await Pokemon.findOne({ name });
        if (existingPokemon) {
            return res.status(400).json({ error: "Le Pokémon existe déjà." });
        }

        // Créer le nouveau Pokémon
        const newPokemon = new Pokemon({
            name,
            types,
            regions,
            hp,
            attack,
            defense,
            specialAttack,
            specialDefense,
            speed,
            description,
            image
        });

        // Sauvegarde en base
        await newPokemon.save();

        res.status(201).json({
            message: "Pokémon créé avec succès !",
            pokemon: newPokemon
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addRegionToPokemon = async (req, res) => {
    try {
        const { pkmnID, regionName, regionPokedexNumber } = req.body;

        // Vérifier si le Pokémon existe
        const pokemon = await Pokemon.findById(pkmnID);
        if (!pokemon) {
            return res.status(404).json({ error: "Pokémon non trouvé" });
        }

        // Vérifier si la région existe déjà pour ce Pokémon
        const existingRegion = pokemon.regions.find(region => region.regionName === regionName);

        if (existingRegion) {
            // Mettre à jour le numéro du Pokédex dans cette région
            existingRegion.regionPokedexNumber = regionPokedexNumber;
        } else {
            // Ajouter une nouvelle région
            pokemon.regions.push({ regionName, regionPokedexNumber });
        }

        // Sauvegarde du Pokémon mis à jour
        await pokemon.save();

        res.status(200).json({
            message: "Région ajoutée/modifiée avec succès !",
            pokemon
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchPokemon = async (req, res) => {
    try {
        const { partialName, typeOne, typeTwo, page = 1, size = 10 } = req.query;

        // Construire un objet de filtre pour MongoDB
        let filter = {};

        if (partialName) {
            filter.name = { $regex: partialName, $options: "i" };
        }
        if (typeOne) {
            filter.types = { $in: [typeOne.toUpperCase()] };
        }
        if (typeTwo) {
            filter.types = { $in: [typeTwo.toUpperCase()] };
        }

        // Pagination
        const limit = parseInt(size);
        const skip = (parseInt(page) - 1) * limit;

        // Exécuter la requête
        const pokemons = await Pokemon.find(filter).skip(skip).limit(limit);
        const count = await Pokemon.countDocuments(filter);

        res.status(200).json({ data: pokemons, count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPokemon = async (req, res) => {
    try {
        const { id, name } = req.query;

        let pokemon;
        if (id) {
            pokemon = await Pokemon.findById(id);
        } else if (name) {
            pokemon = await Pokemon.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        }

        if (!pokemon) {
            return res.status(404).json({ error: "Pokémon non trouvé" });
        }

        res.status(200).json(pokemon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePokemon = async (req, res) => {
    try {
        const { id } = req.query;

        // Vérifier si l'ID est fourni
        if (!id) {
            return res.status(400).json({ error: "L'ID du Pokémon est requis." });
        }

        // Trouver et supprimer le Pokémon
        const deletedPokemon = await Pokemon.findByIdAndDelete(id);

        if (!deletedPokemon) {
            return res.status(404).json({ error: "Pokémon non trouvé." });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePokemon = async (req, res) => {
    try {
        const { id, ...updates } = req.body;

        // Vérifier si l'ID est fourni
        if (!id) {
            return res.status(400).json({ error: "L'ID du Pokémon est requis." });
        }

        // Vérifier si le Pokémon existe
        const pokemon = await Pokemon.findById(id);
        if (!pokemon) {
            return res.status(404).json({ error: "Pokémon non trouvé." });
        }

        // Mettre à jour seulement les champs fournis
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                pokemon[key] = updates[key];
            }
        });

        // Sauvegarde du Pokémon mis à jour
        await pokemon.save();

        res.status(200).json({
            message: "Pokémon mis à jour avec succès !",
            pokemon
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeRegionFromPokemon = async (req, res) => {
    try {
        const { pkmnID, regionName } = req.query;

        // Vérifier si les paramètres sont fournis
        if (!pkmnID || !regionName) {
            return res.status(400).json({ error: "L'ID du Pokémon et le nom de la région sont requis." });
        }

        // Vérifier si le Pokémon existe
        const pokemon = await Pokemon.findById(pkmnID);
        if (!pokemon) {
            return res.status(404).json({ error: "Pokémon non trouvé." });
        }

        // Filtrer pour supprimer la région spécifiée
        const newRegions = pokemon.regions.filter(region => region.regionName !== regionName);

        // Vérifier si une région a été supprimée
        if (newRegions.length === pokemon.regions.length) {
            return res.status(404).json({ error: "La région spécifiée n'existe pas pour ce Pokémon." });
        }

        // Mettre à jour la liste des régions
        pokemon.regions = newRegions;
        await pokemon.save();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {getTypes, createPokemon, addRegionToPokemon, searchPokemon, getPokemon, deletePokemon, updatePokemon, removeRegionFromPokemon};