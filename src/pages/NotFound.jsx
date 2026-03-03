import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-gray-50 overflow-hidden">
            <div className="text-center max-w-md w-full space-y-8">

                {/* Animated 404 number */}
                <div className="relative select-none">
                    <div className="text-[clamp(7rem,25vw,11rem)] font-black text-gray-100 leading-none tracking-tighter">
                        404
                    </div>
                    {/* Floating shopping bag over the number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="bg-black rounded-2xl p-5 shadow-2xl"
                            style={{
                                animation: 'notfound-float 3s ease-in-out infinite'
                            }}
                        >
                            <ShoppingBag size={40} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-3 pt-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        Page Not Found
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                        Looks like this page took a detour. It may have been moved, deleted, or never existed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-black text-white hover:bg-gray-800 rounded-xl h-12 px-8 font-bold transition-all active:scale-95 shadow-md"
                    >
                        <ShoppingBag size={18} className="mr-2" />
                        Back to Shop
                    </Button>
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="rounded-xl h-12 px-8 border-gray-200 font-bold hover:bg-white hover:border-black transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Go Back
                    </Button>
                </div>

                {/* Decorative dots */}
                <div className="flex items-center justify-center gap-2 pt-4 opacity-40">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="rounded-full bg-gray-400"
                            style={{
                                width: i === 2 ? '10px' : '6px',
                                height: i === 2 ? '10px' : '6px',
                                animation: `notfound-bounce 1.4s ease-in-out ${i * 0.1}s infinite`,
                            }}
                        />
                    ))}
                </div>

            </div>

            {/* Inline keyframe styles */}
            <style>{`
        @keyframes notfound-float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-16px) rotate(2deg); }
        }
        @keyframes notfound-bounce {
          0%, 80%, 100% { transform: scaleY(1); }
          40% { transform: scaleY(1.6); }
        }
      `}</style>
        </div>
    )
}
