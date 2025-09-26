"use client";

import Cropper, { Area } from "react-easy-crop";
import { useCallback, useState } from "react";

type Props = {
    src: string;                    // dataURL eller URL
    onCropped: (blob: Blob) => void;
    onCancel: () => void;
};

export default function AvatarCropper({ src, onCropped, onCancel }: Props) {
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    async function toBlobRounded(): Promise<Blob> {
        const img = await loadImage(src);
        const size = Math.min(croppedAreaPixels!.width, croppedAreaPixels!.height);

        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Rund visuel maske (filer gemmes som kvadrat – UI viser dem rundt)
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
            img,
            croppedAreaPixels!.x, croppedAreaPixels!.y,
            size, size,
            0, 0, size, size
        );
        ctx.restore();

        return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.9));
    }

    function loadImage(u: string) {
        return new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image(); i.crossOrigin = "anonymous";
            i.onload = () => res(i); i.onerror = rej; i.src = u;
        });
    }

    return (
        <div className="space-y-4">
            <div className="relative h-80 rounded-2xl overflow-hidden bg-black/30">
                <Cropper
                    image={src}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    restrictPosition
                />
            </div>

            <div className="flex items-center gap-3">
                <input type="range" min={1} max={3} step={0.01} value={zoom}
                       onChange={(e) => setZoom(parseFloat(e.target.value))}
                       className="w-full" />
                <span className="text-sm text-yellow-200/80 w-14 text-right">{zoom.toFixed(2)}×</span>
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-yellow-700/50 hover:bg-yellow-600/10">
                    Annullér
                </button>
                <button onClick={async () => onCropped(await toBlobRounded())}
                        className="px-4 py-2 rounded-lg bg-yellow-600 text-black hover:bg-yellow-500">Brug billede</button>
            </div>
        </div>
    );
}
