<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserProfile;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProfileBanners
{
    public static function validPath(?string $path): bool
    {
        return is_string($path) && preg_match('/\Aprofile-banners\/[a-f0-9]{32}\.webp\z/', $path) === 1;
    }

    public static function url(?UserProfile $profile, bool $forOwner = false): ?string
    {
        if ($profile === null || (! $forOwner && (! $profile->is_public || ! $profile->username)) || ! self::validPath($profile->banner_path)) {
            return null;
        }
        $banner = basename($profile->banner_path, '.webp');

        return route('player-banners.show', ['playerProfile' => $profile->id, 'banner' => $banner], absolute: false);
    }

    public static function deleteFile(?string $path): void
    {
        if (self::validPath($path) && ! Storage::disk('local')->delete($path)) {
            Log::warning('A retired profile banner could not be removed from private storage.');
        }
    }

    public function replace(User $user, UploadedFile $banner): void
    {
        $bytes = $this->normalize($banner);
        $path = 'profile-banners/'.bin2hex(random_bytes(16)).'.webp';
        if (! Storage::disk('local')->put($path, $bytes)) {
            throw ValidationException::withMessages(['banner' => 'Your banner could not be saved. Please try again.']);
        }
        try {
            $previous = DB::transaction(function () use ($user, $path): ?string {
                $user->ensurePlayerProfile();
                $profile = $user->profile()->lockForUpdate()->firstOrFail();
                $previous = $profile->banner_path;
                $profile->forceFill(['banner_path' => $path])->save();

                return $previous;
            });
        } catch (Throwable $exception) {
            self::deleteFile($path);
            throw $exception;
        }
        DB::afterCommit(fn () => self::deleteFile($previous));
    }

    public function remove(User $user): void
    {
        $previous = DB::transaction(function () use ($user): ?string {
            $profile = $user->profile()->lockForUpdate()->firstOrFail();
            $previous = $profile->banner_path;
            $profile->forceFill(['banner_path' => null])->save();

            return $previous;
        });
        DB::afterCommit(fn () => self::deleteFile($previous));
    }

    private function normalize(UploadedFile $banner): string
    {
        $bytes = file_get_contents($banner->getPathname());
        $source = $bytes !== false ? @imagecreatefromstring($bytes) : false;
        if (! $source instanceof GdImage) {
            throw ValidationException::withMessages(['banner' => 'This banner could not be read. Choose a valid JPEG, PNG, or WebP image.']);
        }
        if ($banner->getMimeType() === 'image/jpeg') {
            $exif = @exif_read_data($banner->getPathname());
            $orientation = is_array($exif) && is_numeric($exif['Orientation'] ?? null) ? (int) $exif['Orientation'] : 1;
            if (in_array($orientation, [2, 5, 7], true)) {
                imageflip($source, IMG_FLIP_HORIZONTAL);
            } elseif ($orientation === 4) {
                imageflip($source, IMG_FLIP_VERTICAL);
            }
            $angle = match ($orientation) {
                3 => 180, 5, 8 => 90, 6, 7 => -90, default => 0
            };
            if ($angle !== 0) {
                $rotated = imagerotate($source, $angle, 0);
                if (! $rotated instanceof GdImage) {
                    throw ValidationException::withMessages(['banner' => 'This banner could not be processed. Choose another image.']);
                }
                $source = $rotated;
            }
        }
        $width = imagesx($source);
        $height = imagesy($source);
        $cropWidth = min($width, (int) floor($height * 8 / 3));
        $cropHeight = min($height, (int) floor($width * 3 / 8));
        $canvas = imagecreatetruecolor(1600, 600);
        if (! $canvas instanceof GdImage) {
            throw ValidationException::withMessages(['banner' => 'Image processing is unavailable. Please try again.']);
        }
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        if ($transparent === false) {
            throw ValidationException::withMessages(['banner' => 'This banner could not be processed. Choose another image.']);
        }
        imagefill($canvas, 0, 0, $transparent);
        imagecopyresampled($canvas, $source, 0, 0, (int) floor(($width - $cropWidth) / 2), (int) floor(($height - $cropHeight) / 2), 1600, 600, $cropWidth, $cropHeight);
        $stream = fopen('php://temp', 'w+b');
        if ($stream === false) {
            throw ValidationException::withMessages(['banner' => 'Image processing is unavailable. Please try again.']);
        }
        try {
            if (! imagewebp($canvas, $stream, 90)) {
                throw ValidationException::withMessages(['banner' => 'This banner could not be processed. Choose another image.']);
            }
            rewind($stream);
            $encoded = stream_get_contents($stream);
        } finally {
            fclose($stream);
        }
        if (! is_string($encoded) || $encoded === '') {
            throw ValidationException::withMessages(['banner' => 'This banner could not be processed. Choose another image.']);
        }

        return $encoded;
    }
}
