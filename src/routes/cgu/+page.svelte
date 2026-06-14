<svelte:head>
    <title>Conditions Générales d'Utilisation — Heritage Silencieux</title>
    <meta name="description" content="Conditions Générales d'Utilisation de la plateforme Heritage Silencieux, un espace privé de lecture et de partage littéraire." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=El+Messiri:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<style>
    :global(body) {
        background-color: #1b1b1b;
        color: #fff;
        margin: 0;
        padding: 0;
        font-family: 'El Messiri', sans-serif;
    }

    .page-wrapper {
        min-height: 100vh;
        background-color: #1b1b1b;
        background-image: url('/soft-neige1B1B1B.png');
        color: #fff;
        font-family: 'El Messiri', sans-serif;
    }

    header {
        background: rgba(27, 27, 27, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        padding: 1.25rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 20;
    }

    .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
    }

    .logo-link img {
        height: 2rem;
        filter: invert(76%) sepia(57%) saturate(281%) hue-rotate(2deg) brightness(88%) contrast(87%);
    }

    .back-link {
        font-family: 'EB Garamond', serif;
        font-size: 0.85rem;
        color: #D2B674;
        text-decoration: none;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: #CFDFC4;
    }

    main {
        max-width: 800px;
        margin: 0 auto;
        padding: 4rem 2rem 6rem;
    }

    .page-label {
        font-family: 'EB Garamond', serif;
        font-size: 0.75rem;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #D2B674;
        margin-bottom: 1rem;
    }

    h1 {
        font-family: 'EB Garamond', serif;
        font-size: 2.5rem;
        font-weight: 400;
        color: #fff;
        margin: 0 0 0.5rem;
        line-height: 1.2;
    }

    .subtitle {
        color: rgba(255,255,255,0.4);
        font-size: 0.85rem;
        font-family: 'El Messiri', sans-serif;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .divider {
        width: 3rem;
        height: 1px;
        background: linear-gradient(to right, #D2B674, transparent);
        margin: 2.5rem 0;
    }

    section {
        margin-bottom: 2.5rem;
    }

    h2 {
        font-family: 'EB Garamond', serif;
        font-size: 1.3rem;
        font-weight: 500;
        color: #CFDFC4;
        margin: 0 0 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    h2::before {
        content: '';
        display: inline-block;
        width: 0.35rem;
        height: 1.1rem;
        background: #D2B674;
        border-radius: 2px;
        flex-shrink: 0;
    }

    p {
        color: rgba(255,255,255,0.72);
        line-height: 1.8;
        font-size: 0.92rem;
        margin: 0 0 0.9rem;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0 0.9rem;
    }

    ul li {
        color: rgba(255,255,255,0.72);
        font-size: 0.92rem;
        line-height: 1.8;
        padding-left: 1.5rem;
        position: relative;
        margin-bottom: 0.3rem;
    }

    ul li::before {
        content: '—';
        position: absolute;
        left: 0;
        color: #D2B674;
        font-family: 'EB Garamond', serif;
    }

    .highlight-box {
        background: rgba(210, 182, 116, 0.07);
        border: 1px solid rgba(210, 182, 116, 0.2);
        border-radius: 5px;
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
    }

    .highlight-box p {
        margin: 0;
    }

    .update-date {
        text-align: center;
        color: rgba(255,255,255,0.25);
        font-size: 0.75rem;
        font-family: 'EB Garamond', serif;
        letter-spacing: 0.1em;
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255,255,255,0.06);
    }
</style>

<div class="page-wrapper">
    <header>
        <a href="/" class="logo-link" aria-label="Retour à l'accueil">
            <img src="/Heritage_Silencieux_Logo.svg" alt="Heritage Silencieux" />
        </a>
        <a href="/" class="back-link">← Retour</a>
    </header>

    <main>
        <p class="page-label">Document légal</p>
        <h1>Conditions Générales d'Utilisation</h1>
        <p class="subtitle">Heritage Silencieux — Dernière mise à jour : juin 2026</p>

        <section>
            <h2>Présentation</h2>
            <p>
                Heritage Silencieux est une plateforme privée de lecture et de partage littéraire, destinée à un usage strictement personnel et communautaire entre membres invités. L'accès à la plateforme est soumis à une invitation préalable ou à une approbation par un administrateur de club.
            </p>
            <div class="highlight-box">
                <p>En accédant à Heritage Silencieux, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.</p>
            </div>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Accès à la plateforme</h2>
            <p>L'accès à Heritage Silencieux est réservé aux personnes ayant été invitées et dont l'inscription a été validée. Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.</p>
            <ul>
                <li>L'inscription est soumise à l'approbation d'un administrateur ou propriétaire de club.</li>
                <li>Un compte ne peut être partagé entre plusieurs personnes.</li>
                <li>Tout accès non autorisé est interdit.</li>
            </ul>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Utilisation des contenus</h2>
            <p>
                Les œuvres littéraires, chapitres et textes publiés sur Heritage Silencieux sont mis à disposition dans un cadre strictement privé, entre membres d'un même club de lecture. Toute diffusion, reproduction ou exploitation commerciale est interdite.
            </p>
            <ul>
                <li>Les contenus sont à usage personnel et non commercial.</li>
                <li>La redistribution à des tiers non membres est interdite.</li>
                <li>Le respect des droits d'auteur des œuvres publiées est obligatoire.</li>
            </ul>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Comportement des membres</h2>
            <p>Chaque membre s'engage à respecter les autres utilisateurs de la plateforme et à contribuer à un environnement de partage littéraire bienveillant et respectueux.</p>
            <ul>
                <li>Les critiques et commentaires doivent rester courtois et constructifs.</li>
                <li>Tout contenu offensant, discriminatoire ou illicite est interdit.</li>
                <li>Le harcèlement ou la mise en cause personnelle d'autres membres est strictement prohibé.</li>
            </ul>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Données personnelles</h2>
            <p>
                Heritage Silencieux collecte uniquement les données nécessaires au fonctionnement de la plateforme : nom d'utilisateur, adresse email et éventuellement une photo de profil. Ces données ne sont pas transmises à des tiers et sont utilisées exclusivement dans le cadre de la plateforme.
            </p>
            <ul>
                <li>Vous pouvez modifier votre photo de profil depuis votre espace personnel.</li>
                <li>Pour toute demande de suppression de compte, contactez un administrateur.</li>
                <li>Aucune donnée n'est vendue ou cédée à des tiers.</li>
            </ul>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Responsabilité</h2>
            <p>
                Heritage Silencieux est fourni en l'état, sans garantie de disponibilité continue. Les administrateurs de la plateforme ne sauraient être tenus responsables des interruptions de service, pertes de données ou tout dommage résultant de l'utilisation de la plateforme.
            </p>
            <p>
                Chaque utilisateur est seul responsable des contenus qu'il publie (chapitres, critiques, commentaires) et s'engage à s'assurer qu'ils ne violent aucune loi applicable.
            </p>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Modification des CGU</h2>
            <p>
                Les présentes Conditions Générales d'Utilisation peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.
            </p>
        </section>

        <div class="divider"></div>

        <section>
            <h2>Contact</h2>
            <p>
                Pour toute question relative aux présentes CGU ou à la plateforme Heritage Silencieux, veuillez contacter un administrateur directement via ce mail <a href="mailto: mjaeteria@gmail.com" style="color: var(--color-secondary)">mjaeteria@gmail.com</a>.
            </p>
        </section>

        <p class="update-date">Heritage Silencieux · Conditions Générales d'Utilisation · Juin 2026</p>
    </main>
</div>
