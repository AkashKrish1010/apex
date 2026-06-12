import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { BMI_CATEGORIES } from '@/constants';

export default function BmiCalculator() {
  const { state, updateProfile } = useAppStore();
  const profile = state.profile;

  const [inputName, setInputName] = useState(profile.name);
  const [inputAge, setInputAge] = useState(profile.age);
  const [inputGender, setInputGender] = useState(profile.gender);
  const [inputHeight, setInputHeight] = useState(profile.height);
  const [inputWeight, setInputWeight] = useState(profile.weight);
  const [unit, setUnit] = useState(profile.unitSystem);
  const [validationError, setValidationError] = useState('');

  const containerRef = useRef<HTMLElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const handleCalculate = () => {
    // Input validation
    if (inputName.length > 100) { setValidationError('Name must be 100 characters or fewer.'); return; }
    if (!Number.isFinite(inputAge) || inputAge < 1 || inputAge > 120) { setValidationError('Age must be between 1 and 120.'); return; }
    if (!Number.isFinite(inputHeight) || inputHeight <= 0 || inputHeight > 300) { setValidationError('Height must be between 1 and 300.'); return; }
    if (!Number.isFinite(inputWeight) || inputWeight <= 0 || inputWeight > 700) { setValidationError('Weight must be between 1 and 700.'); return; }
    setValidationError('');
    updateProfile({
      name: inputName.trim(),
      age: inputAge,
      gender: inputGender,
      height: inputHeight,
      weight: inputWeight,
      unitSystem: unit
    });
  };

  useGSAP(() => {
    if (!profile.bmi) return;

    // Needle rotation map: BMI 15 -> -90deg, BMI 40 -> +90deg
    const minBMI = 15;
    const maxBMI = 40;
    const clampedBMI = Math.max(minBMI, Math.min(profile.bmi, maxBMI));
    const rotation = ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 180 - 90;

    gsap.to(needleRef.current, {
      rotation,
      transformOrigin: "bottom center",
      duration: 1.5,
      ease: "back.out(1.5)"
    });

    gsap.to(counterRef.current, {
      innerHTML: profile.bmi,
      duration: 1.5,
      ease: "power2.out",
      snap: { innerHTML: 0.1 },
      onUpdate: function() {
        if (counterRef.current) {
          counterRef.current.innerHTML = Number(this.targets()[0].innerHTML).toFixed(1);
        }
      }
    });

  }, [profile.bmi]);

  const currentCategory = BMI_CATEGORIES.find(c => profile.bmi <= c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];

  return (
    <section ref={containerRef} className="w-full min-h-screen flex flex-col items-center py-24 px-4 bg-darker relative z-10">
      
      <div className="max-w-4xl w-full mb-8 text-center md:text-left">
        <h2 className="bebas text-5xl md:text-7xl text-lime-400">BMI CALCULATOR</h2>
        <p className="font-mono text-gray-400 mt-2 uppercase text-xs">Establish your baseline.</p>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left: SVG Gauge */}
        <div className="flex flex-col items-center bg-dark p-8 border border-dark-border w-full">
          <div className="relative w-64 h-36 overflow-hidden mb-6">
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              {/* Arc divided into sections */}
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#222" strokeWidth="20" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 60 30" fill="none" stroke="#3b82f6" strokeWidth="20" /> {/* Blue */}
              <path d="M 60 30 A 80 80 0 0 1 140 30" fill="none" stroke="#22c55e" strokeWidth="20" /> {/* Green */}
              <path d="M 140 30 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="20" /> {/* Red */}
              
              {/* Needle */}
              <g ref={needleRef} transform="translate(100 100)">
                <circle cx="0" cy="0" r="6" fill="#ccff00" />
                <path d="M -3 0 L 0 -75 L 3 0 Z" fill="#ccff00" />
              </g>
            </svg>
          </div>
          
          <div className="text-center">
            <h2 className="bebas text-6xl text-white tracking-wider">
              <span ref={counterRef}>0.0</span>
            </h2>
            {profile.bmi > 0 && (
               <div className={`mt-2 font-mono text-lg uppercase font-bold animate-pulse ${currentCategory.color}`}>
                 {currentCategory.label}
               </div>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-dark p-6 md:p-8 border border-dark-border w-full">
          <h2 className="bebas text-2xl md:text-3xl mb-6 text-white text-center md:text-left">SYSTEM CALIBRATION</h2>
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-1">NAME</label>
                <input 
                  type="text" 
                  value={inputName} 
                  onChange={e => setInputName(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border p-2 md:p-3 text-white focus:border-lime-400 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-1">AGE</label>
                <input 
                  type="number" 
                  value={inputAge} 
                  onChange={e => setInputAge(Number(e.target.value))}
                  className="w-full bg-dark-surface border border-dark-border p-2 md:p-3 text-white focus:border-lime-400 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 mb-1">GENDER</label>
              <div className="flex gap-2">
                {['M', 'F'].map(g => (
                  <button 
                    key={g}
                    onClick={() => setInputGender(g)}
                    className={`flex-1 p-2 md:p-3 border font-bebas text-lg md:text-xl transition-all ${inputGender === g ? 'bg-lime-400 border-lime-400 text-dark' : 'bg-dark-surface border-dark-border text-white hover:border-gray-500'}`}
                  >
                    {g === 'M' ? 'MALE' : 'FEMALE'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1">
                  <span>HT</span>
                  <button onClick={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')} className="text-lime-400 hover:underline">
                    {unit === 'metric' ? 'cm' : 'in'}
                  </button>
                </label>
                <input 
                  type="number" 
                  value={inputHeight} 
                  onChange={e => setInputHeight(Number(e.target.value))}
                  className="w-full bg-dark-surface border border-dark-border p-2 md:p-3 text-white focus:border-lime-400 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1">
                  <span>WT</span>
                  <span className="text-lime-400">{unit === 'metric' ? 'kg' : 'lb'}</span>
                </label>
                <input 
                  type="number" 
                  value={inputWeight} 
                  onChange={e => setInputWeight(Number(e.target.value))}
                  className="w-full bg-dark-surface border border-dark-border p-2 md:p-3 text-white focus:border-lime-400 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {validationError && (
              <p className="text-red-400 font-mono text-xs mt-2">{validationError}</p>
            )}
            <button 
              onClick={handleCalculate}
              className="w-full mt-4 bg-lime-400 text-dark bebas text-xl py-3 hover:bg-lime-300 transition-colors transform hover:scale-[1.02] duration-300"
            >
              CALCULATE RESULTS
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
