import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const COLOR_PRESETS = [
  '#AA5E2F', '#C9732B', '#D62976', '#FA7E1E', '#FCAF45', '#1D1D1F',
  '#5c3a2d', '#128C7E', '#1D9BF0', '#1877F2', '#962FBF', '#3F51B5',
  '#FF0000', '#FF9900', '#00FF00', '#00FFFF', '#0000FF', '#9900FF',
];

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [localColor, setLocalColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalColor(e.target.value);
  };
  
  const handleInputBlur = () => {
    onChange(localColor);
  };

  const handlePresetClick = (preset: string) => {
    onChange(preset);
    setLocalColor(preset);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("h-10 w-full flex items-center justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-sm border border-border"
              style={{ backgroundColor: localColor }}
            />
            <span className="text-sm">{localColor}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <div 
            className="w-full h-20 rounded-md border" 
            style={{ backgroundColor: localColor }}
          />
          
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              type="text"
              value={localColor}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="text-xs"
              maxLength={9}
            />
            <Input
              type="color"
              value={localColor}
              onChange={(e) => {
                setLocalColor(e.target.value);
                onChange(e.target.value);
              }}
              className="w-10 p-1 h-10"
            />
          </div>
          
          <div className="grid grid-cols-6 gap-1 mt-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                className={`h-6 w-6 rounded-sm ${
                  preset.toLowerCase() === localColor.toLowerCase()
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'border border-border'
                }`}
                style={{ backgroundColor: preset }}
                onClick={() => handlePresetClick(preset)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}