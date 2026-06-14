export const errorSentences: string[] = [
    "Adam ne lit que des livres avec des dessins, car il ne lit que des livres sur l'art de l'épée.",
    "Axra n'osait pas montrer qu'il lisait, il se cachait quand il allait dans la bibliothèque de M. Fahe.",
    "Kanna a pour rêve d'entrer dans l'Héritage Silencieux. Elle prévoit de partir à Irisia pour le réaliser.",
    "Malgré ce qu'on pourrait croire, Xianos lit beaucoup plus que la majorité des autres Miraculés.",
    "Esra ne lit jamais. Ou du moins, vous n'en avez pas le souvenir.",
    "Il arrivait que Liva vole des livres à la bibliothèque pour les lire dans le parc, à l'abri des regards.",
    "Si Gora avait passé tout le temps qu'il a passé au bar à la bibliothèque, il aurait lu 687 livres de plus.",
    "Zayath se servait de Dada comme repose livre, il se faisait régulièrement crier dessus car cela salissait les pages.",
    "Lato a lu tous les livres ayant un lien avec la Diablesse, même les manuscrits les plus difficiles à lire.",
    "Phillia écrivait beaucoup plus qu'elle ne lisait. Son éducation de moine l'avait sans doute habitué à cela.",
    "Lyra n'aimait pas du tout lire, mais elle adorait fabriquer des carnets avec du cuir et du papier recyclé.",
    "Destra se servait plus des livres pour cacher le fait qu'il dormait que pour s'instruire.",
    "La famille de Leest possède une bibliothèque encore plus grande que celle de M. Fahe, elle vous a déjà invité à la consulter.",
    "Hada lisait régulièrement des histoires aux enfants le soir, ses histoires n'étaient pas très adaptées à leur âge. Maintenant, vous comprenez qu'il fallait bien cela pour les préparer à la vie de noble combattant.",
    "L'Héritage Silencieux est la plus grande bibliothèque du monde, la collection personnelle de Lada n'arrive qu'en deuxième position.",
    "Afin d'éviter un incendie dévastateur, l'Héritage Silencieux, ainsi que les bibliothèques à l'intérieur, sont construits en pierres noires récoltées dans les montagnes au Nord d'Irisia.",
    "De nombreux symboles religieux ornent les murs de l'Héritage Silencieux, même celui de Yinva.",
    "Tous les livres religieux portent une couverture de la couleur lié à leur divinité, à l'exception de ceux parlant de Yinva. Les livres ayant des couvertures roses sont extrêmement rares, même dans l'Héritage Silencieux.",
    "L'Héritage Silencieux recrute tous les ans des Éternels dont la mission est de s'occuper des livres, en rédiger, en copier ou en partant les chercher à travers les 4 coins d'Arthera. Ils sont surnommés \"Les Petits Anges\"",
    "L'accès à l'Héritage Silencieux est très restreint, il faut une autorisation pour y accéder, même en étant noble ou érudit.",
    "Pendant la guerre d'Irisia, Art Driinos II, Roi d'Augeaime, a été très clair, une peine de mort serait appliquée à toute personne qui s'en prendrait à l'Héritage Silencieux ou à La Couronne.",
    "Des rumeurs racontent qu'il y aurait des passages secrets avec des ouvrages mystérieux dans l'Héritage Silencieux. Cependant, aucun des Petits Anges n'a confirmé l'existence d'une telle chose."
];

/**
 * Returns a random error sentence, optionally excluding the current one to prevent consecutive duplicates.
 */
export function getRandomErrorSentence(exclude?: string): string {
    const pool = exclude
        ? errorSentences.filter(s => s !== exclude)
        : errorSentences;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}
