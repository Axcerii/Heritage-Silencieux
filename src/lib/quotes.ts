export interface Quote {
    text: string;
    author: string;
}

export const quotes: Quote[] = [
    {
        text: "Vous, transmettez, voici la tâche qui incombe à ceux qui ne meurent pas.",
        author: "Attribué à Artrish concernant les Éternelles"
    },
    {
        text: "Modifier l'histoire est facile, le plus dur, est l'attente de l'oubli.",
        author: "Yinva"
    },
    {
        text: "Pour nous, immortels, un livre n'est pas seulement un savoir, c'est surtout... un souvenir.",
        author: "Guizamark"
    },
    {
        text: "Je ne peux effacer ce qui est écrit, c'est pour cela que Goliath continue encore de nous hanter.",
        author: "Attribué à Shizari"
    },
    {
        text: "L'écriture est la première invention d'Artrish, c'est pour cela que tout texte est sacré.",
        author: "Pestia"
    },
    {
        text: "Vous passez plus de temps à rectifier votre passé qu'à façonner votre avenir, malgré nos différends, je sais qu'il n'aurait pas aimé cela.",
        author: "Attribué à Chronos"
    },
    {
        text: "Et ainsi, tant que ce règlement sera respecté, moi, Drii, promets de ne plus interferer dans les affaires des nograds sur cette terre désormais appelée Augeaime.",
        author: "Fin du traité d'Augeaime, par Drii"
    }
];

/**
 * Returns a random quote from the list.
 */
export function getRandomQuote(): Quote {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}
