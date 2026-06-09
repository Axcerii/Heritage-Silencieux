<div class="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
    <div class="heartbeat-pulse w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] rounded-full bg-secondary opacity-25 filter blur-[60px] sm:blur-[90px]"></div>
</div>

<style>
    .heartbeat-pulse {
        animation: heartbeat 2.2s infinite ease-in-out;
    }

    @keyframes heartbeat {
        0%, 100% {
            transform: scale(0.85);
            filter: blur(80px);
            opacity: 0.18;
        }
        14% {
            transform: scale(1.1);
            filter: blur(70px);
            opacity: 0.38;
        }
        28% {
            transform: scale(0.98);
            filter: blur(76px);
            opacity: 0.24;
        }
        42% {
            transform: scale(1.2);
            filter: blur(60px);
            opacity: 0.45;
        }
        70% {
            transform: scale(0.85);
            filter: blur(80px);
            opacity: 0.18;
        }
    }
</style>
