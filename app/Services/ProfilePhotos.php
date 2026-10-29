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

class ProfilePhotos
{
    public static function validPath(?string $path): bool
    {
        return is_string($path) && preg_match('/\Aavatars\/[a-f0-9]{32}\.webp\z/', $path) === 1;
    }

    public static function url(?UserProfile $profile, bool $forOwner = false): ?string
    {
        if ($profile === null || (! $forOwner && (! $profile->is_public || ! $profile->username)) || ! self::validPath($profile->avatar_path)) {
            return null;
        }
        $photo = basename($profile->avatar_path, '.webp');

        return route('player-photos.show', ['playerProfile' => $profile->id, 'photo' => $photo], absolute: false);
    }

    public static function deleteFile(?string $path): void
    {
        if (self::validPath($path) && ! Storage::disk('local')->delete($path)) {
            Log::warning('A retired profile photo could not be removed from private storage.');
        }
    }

    public function replace(User $user, UploadedFile $photo): void
    {
        if (! $user->profile()->exists()) {
            throw ValidationException::withMessages(['avatar' => 'Save your player profile before adding a photo.']);
        }
        $bytes = $this->normalize($photo);
        $path = 'avatars/'.bin2hex(random_bytes(16)).'.webp';
        if (! Storage::disk('local')->put($path, $bytes)) {
            throw ValidationException::withMessages(['avatar' => 'Your photo could not be saved. Please try again.']);
        }
        try {
            $previous = DB::transaction(function () use ($user, $path): ?string {
                $profile = $user->profile()->lockForUpdate()->firstOrFail();
                $previous = $profile->avatar_path;
                $profile->forceFill(['avatar_path' => $path])->save();

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
            $previous = $profile->avatar_path;
            $profile->forceFill(['avatar_path' => null])->save();

            return $previous;
        });
        DB::afterCommit(fn () => self::deleteFile($previous));
    }

    private function normalize(UploadedFile $photo): string
    {
        $bytes = file_get_contents($photo->getPathname());
        $source = $bytes !== false ? @imagecreatefromstring($bytes) : false;
        if (! $source instanceof GdImage) {
            throw ValidationException::withMessages(['avatar' => 'This photo could not be read. Choose a valid JPEG, PNG, or WebP image.']);
        }
        if ($photo->getMimeType() === 'image/jpeg') {
            $exif = @exif_read_data($photo->getPathname());
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
                    throw ValidationException::withMessages(['avatar' => 'This photo could not be processed. Choose another image.']);
                }
                $source = $rotated;
            }
        }
        $width = imagesx($source);
        $height = imagesy($source);
        $side = min($width, $height);
        $canvas = imagecreatetruecolor(512, 512);
        if (! $canvas instanceof GdImage) {
            throw ValidationException::withMessages(['avatar' => 'Image processing is unavailable. Please try again.']);
        }
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        if ($transparent === false) {
            throw ValidationException::withMessages(['avatar' => 'This photo could not be processed. Choose another image.']);
        }
        imagefill($canvas, 0, 0, $transparent);
        imagecopyresampled($canvas, $source, 0, 0, (int) floor(($width - $side) / 2), (int) floor(($height - $side) / 2), 512, 512, $side, $side);
        $stream = fopen('php://temp', 'w+b');
        if ($stream === false) {
            throw ValidationException::withMessages(['avatar' => 'Image processing is unavailable. Please try again.']);
        }
        try {
            if (! imagewebp($canvas, $stream, 90)) {
                throw ValidationException::withMessages(['avatar' => 'This photo could not be processed. Choose another image.']);
            }
            rewind($stream);
            $encoded = stream_get_contents($stream);
        } finally {
            fclose($stream);
        }
        if (! is_string($encoded) || $encoded === '') {
            throw ValidationException::withMessages(['avatar' => 'This photo could not be processed. Choose another image.']);
        }

        return $encoded;
    }
}
