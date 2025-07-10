"use client"

export default function DeFiAnimation() {
    return (
        <div className="w-full max-w-[600px] h-[400px] rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <CollSwapLogo />
        </div>
    )
}

// CollSwap Logo - 600x400 with DEX and Money Flow Concept
function CollSwapLogo() {
    return (
        <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                {/* Enhanced Gradients */}
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="30%" stopColor="#8B5CF6" />
                    <stop offset="70%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>

                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="50%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#34D399" />
                </linearGradient>

                <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="50%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#FB7185" />
                </linearGradient>

                {/* Enhanced Glow Effects */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <filter id="coinGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Background Grid Pattern */}
                <pattern id="animatedGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="url(#primaryGradient)" strokeWidth="0.5" opacity="0.3">
                        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
                    </path>
                </pattern>
            </defs>

            {/* Background Grid with Animation */}
            {/* <rect width="600" height="400" fill="url(#animatedGrid)" /> */}

            {/* Background Energy Waves */}
            {/* <circle cx="150" cy="200" r="100" fill="url(#primaryGradient)" opacity="0.05">
                <animate attributeName="r" values="100;120;100" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="200" r="80" fill="url(#primaryGradient)" opacity="0.08">
                <animate attributeName="r" values="80;100;80" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="200" r="60" fill="url(#primaryGradient)" opacity="0.12">
                <animate attributeName="r" values="60;80;60" dur="2s" repeatCount="indefinite" />
            </circle> */}

            {/* Central Lock/Unlock Symbol */}
            <g transform="translate(120, 170)">
                {/* Lock Body with DEX Pattern */}
                <rect x="0" y="20" width="60" height="45" rx="8" fill="url(#primaryGradient)" filter="url(#glow)" />

                {/* Unlock Shackle (Breaking Open) */}
                <path
                    d="M10 20 L10 5 Q10 -10 30 -10 Q50 -10 50 5 L50 12"
                    stroke="url(#primaryGradient)"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    filter="url(#glow)"
                />

                {/* Breaking Effect with Animation */}
                <path d="M50 12 L65 8" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" filter="url(#glow)">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                </path>
                <circle cx="68" cy="7" r="2" fill="#FCD34D" filter="url(#coinGlow)">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="72" cy="5" r="1.5" fill="#F59E0B" filter="url(#coinGlow)">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
                </circle>

                {/* Keyhole with Exchange Symbol */}
                <circle cx="30" cy="35" r="6" fill="white" opacity="0.9" />
                <path d="M27 35 L33 35 M30 32 L30 38" stroke="url(#primaryGradient)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Flowing Money/Coins */}
            <g>
                {/* Large Coins with enhanced animation */}
                <circle cx="200" cy="150" r="12" fill="url(#goldGradient)" filter="url(#coinGlow)">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 15,-8; 30,-12; 45,-8; 60,0"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="200" y="155" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 15,-8; 30,-12; 45,-8; 60,0"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                    $
                </text>

                <circle cx="220" cy="180" r="10" fill="url(#goldGradient)" filter="url(#coinGlow)">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 12,-6; 24,-10; 36,-6; 48,0"
                        dur="3.5s"
                        repeatCount="indefinite"
                    />
                </circle>
                <text x="220" y="185" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 12,-6; 24,-10; 36,-6; 48,0"
                        dur="3.5s"
                        repeatCount="indefinite"
                    />
                    €
                </text>

                <circle cx="240" cy="210" r="8" fill="url(#goldGradient)" filter="url(#coinGlow)">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 10,-4; 20,-8; 30,-4; 40,0"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </circle>
                <text x="240" y="215" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 10,-4; 20,-8; 30,-4; 40,0"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                    ¥
                </text>

                {/* Small Flowing Particles */}
                <circle cx="190" cy="170" r="3" fill="#FCD34D" opacity="0.8">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 20,-10; 40,-15; 60,-10; 80,0"
                        dur="2.5s"
                        repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="210" cy="200" r="2" fill="#F59E0B" opacity="0.7">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 18,-8; 36,-12; 54,-8; 72,0"
                        dur="2.8s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="230" cy="160" r="2.5" fill="#FCD34D" opacity="0.6">
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 16,-7; 32,-11; 48,-7; 64,0"
                        dur="3.2s"
                        repeatCount="indefinite"
                    />
                </circle>
            </g>

            {/* DEX Exchange Arrows */}
            <g transform="translate(180, 240)">
                {/* Circular Exchange Symbol */}
                <circle cx="0" cy="0" r="25" fill="none" stroke="url(#greenGradient)" strokeWidth="3" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Exchange Arrows with rotation */}
                <g>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 0 0;360 0 0"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                    <path
                        d="M-15 -8 L15 -8 M10 -13 L15 -8 L10 -3"
                        stroke="url(#greenGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                    <path
                        d="M15 8 L-15 8 M-10 3 L-15 8 L-10 13"
                        stroke="url(#greenGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                </g>
            </g>

            {/* Upward Growth Arrow */}
            <g transform="translate(80, 120)">
                <path
                    d="M0 40 L0 0 M-8 8 L0 0 L8 8"
                    stroke="url(#greenGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                >
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </path>
                <text x="15" y="20" fontSize="12" fill="url(#greenGradient)" opacity="0.8">
                    +APY
                </text>
            </g>

            {/* Liquidity Flow Lines */}
            <path
                d="M100 140 Q150 120 200 140 T300 160"
                stroke="url(#primaryGradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
                strokeDasharray="5,5"
            >
                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
            </path>

            <path
                d="M120 260 Q170 240 220 260 T320 280"
                stroke="url(#primaryGradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
                strokeDasharray="3,3"
            >
                <animate attributeName="stroke-dashoffset" values="0;6" dur="1.5s" repeatCount="indefinite" />
            </path>

            {/* Text: CollSwap */}
            <text
                x="400"
                y="190"
                fontFamily="Arial, sans-serif"
                fontSize="44"
                fontWeight="bold"
                fill="url(#textGradient)"
                filter="url(#glow)"
                textAnchor="middle"
            >
                UnlockX
            </text>
            {/* <text
        x="300"
        y="230"
        fontFamily="Arial, sans-serif"
        fontSize="44"
        fontWeight="bold"
        fill="url(#pinkGradient)"
        filter="url(#glow)"
        textAnchor="middle"
      >
        Swap
      </text> */}

            {/* Enhanced Subtitle */}
            <text x="400" y="220" fontFamily="Arial, sans-serif" fontSize="16" fill="#A78BFA" opacity="0.9" textAnchor="middle">
                Collateral DEX Protocol
            </text>
            <text x="400" y="240" fontFamily="Arial, sans-serif" fontSize="14" fill="#34D399" opacity="0.7" textAnchor="middle">
                Secure • Trade • Unlock
            </text>

            {/* Decorative Tech Elements */}
            <g opacity="0.6">
                <polygon points="520,120 540,140 520,160" fill="url(#primaryGradient)">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
                </polygon>
                <polygon points="560,100 580,120 560,140" fill="url(#goldGradient)">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </polygon>
                <circle cx="540" cy="280" r="4" fill="url(#greenGradient)">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="560" cy="300" r="3" fill="url(#primaryGradient)">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" />
                </circle>
            </g>
        </svg>
    )
}
