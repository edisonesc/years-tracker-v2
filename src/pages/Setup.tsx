import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/DatePicker";
import { BIRTH_DATE_KEY } from "@/constants";

export default function Setup() {
  const navigate = useNavigate();
  const [birthdate, setBirthdate] = useState(localStorage.getItem(BIRTH_DATE_KEY) ?? "");

  const isValid = birthdate !== "" && new Date(birthdate) < new Date();

  function handleProceed() {
    localStorage.setItem(BIRTH_DATE_KEY, birthdate);
    navigate("/home");
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f0f] p-8">
      {/* Subtle radial glow in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-primary-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo / Icon mark */}
        <div className="flex flex-col items-center gap-3">
          {/* <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-xl select-none">🗓</span>
          </div> */}
          <div className="text-center space-y-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-400/60 mb-1">
                @edisonesc
              </p>
              <h1 className="text-2xl font-semibold tracking-tight bg-linear-to-r from-white to-white/50 bg-clip-text text-transparent">
                Life Tracker
              </h1>
            </div>
            <p className="mt-1 text-sm text-white/35">
              How many years have you lived?
            </p>
          </div>
        </div>

        {/* Card */}
        <Card className="bg-white/[0.03] border border-white/[0.08] shadow-2xl rounded-2xl backdrop-blur-sm">
          <CardContent className="flex flex-col gap-4">
            {/* Field */}
            <div className="py-4 flex flex-col gap-2">
              <Label
                htmlFor="birthdate"
                className="text-xs font-medium uppercase tracking-widest text-white/40"
              >
                Date of Birth
              </Label>
              <DatePicker
                value={birthdate}
                onChange={setBirthdate}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* CTA */}
            <Button
              disabled={!isValid}
              onClick={handleProceed}
              className="w-full h-11 rounded-xl font-medium text-sm tracking-wide
                         bg-primary-500 hover:bg-primary-400 text-white
                         disabled:opacity-20 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-lg shadow-primary-500/20"
            >
              Continue
              <span className="ml-1.5 opacity-70">→</span>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-white/15 tracking-wide">
          Stored locally · Never shared
        </p>
      </div>
    </div>
  );
}
