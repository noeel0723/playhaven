<?php

namespace App\Enums;

enum GameConnectionType: string
{
    case Prequel = 'prequel';
    case Sequel = 'sequel';
    case Universe = 'universe';
    case Series = 'series';
    case Addition = 'addition';
    case ParentGame = 'parent';

    public function inverse(): self
    {
        return match ($this) {
            self::Prequel => self::Sequel,
            self::Sequel => self::Prequel,
            self::Addition => self::ParentGame,
            self::ParentGame => self::Addition,
            default => $this,
        };
    }
}
