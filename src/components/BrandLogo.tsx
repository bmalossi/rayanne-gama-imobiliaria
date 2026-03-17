import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-principal-branco-transparente.png";
import logoBlack from "@/assets/logo-principal-preto-transparente.png";
import logoMark from "@/assets/logo-mark.png";
import logoWhiteSvg from "@/assets/logo-principal-branco-transparente.svg";
import logoBlackSvg from "@/assets/logo-principal-preto-transparente.svg";
import logoMarkSvg from "@/assets/logo-mark.svg";

interface BrandLogoProps {
    variant?: "white" | "black" | "mark";
    className?: string;
    useSvg?: boolean;
}

export function BrandLogo({ variant = "black", className, useSvg = false }: BrandLogoProps) {
    // Mapping for PNGs
    const pngMap = {
        white: logoWhite,
        black: logoBlack,
        mark: logoMark,
    };

    // Mapping for SVGs
    const svgMap = {
        white: logoWhiteSvg,
        black: logoBlackSvg,
        mark: logoMarkSvg,
    };

    const src = useSvg ? svgMap[variant] : pngMap[variant];

    // Note: Using PNGs by default because some SVGs were detected as empty placeholders.
    // Full logo (white/black) should be larger than mark version.
    const isMark = variant === "mark";

    return (
        <div className={cn("flex items-center", className)}>
            <img
                src={src}
                alt="Rayanne Gama Imóveis"
                className={cn(
                    "w-auto transition-all duration-300",
                    isMark ? "h-8 md:h-10" : "h-7 md:h-9"
                )}
                draggable={false}
            />
        </div>
    );
}
