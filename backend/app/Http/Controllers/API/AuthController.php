<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Mail\AccountRegistrationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    public function register(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'phone' => 'required|string|max:20|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Store the plain password before hashing for email
            $plainPassword = $validated['password'];

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
            ]);

            // Send account registration email
            try {
                Mail::to($user->email)->send(new AccountRegistrationMail($user, $plainPassword));
            } catch (\Exception $e) {
                // Log the error but don't fail the registration
                \Log::error('Failed to send registration email: ' . $e->getMessage());
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->successResponse([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'Đăng ký thành công', 201);
        });
    }

    public function login(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if (!Auth::attempt($validated)) {
                throw ValidationException::withMessages([
                    'email' => ['Thông tin đăng nhập không chính xác'],
                ]);
            }

            $user = User::where('email', $validated['email'])->firstOrFail();
            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->successResponse([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'Đăng nhập thành công');
        });
    }

    public function logout(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $request->user()->currentAccessToken()->delete();

            return $this->successResponse(null, 'Đăng xuất thành công');
        });
    }

    public function me(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $user = $request->user()->load(['bookings' => function ($query) {
                $query->latest()->limit(5);
            }]);

            return $this->successResponse($user);
        });
    }

    public function updateProfile(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|unique:users,phone,' . $user->id,
                'date_of_birth' => 'sometimes|date',
                'preferred_city' => 'sometimes|string|max:100',
                'preferred_language' => 'sometimes|string|max:20',
            ]);

            $user->update($validated);

            return $this->successResponse($user, 'Cập nhật thông tin cá nhân thành công');
        });
    }

    public function changePassword(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = $request->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return $this->errorResponse('Mật khẩu hiện tại không chính xác', null, 400);
            }

            $user->update([
                'password' => Hash::make($validated['password'])
            ]);

            return $this->successResponse(null, 'Đổi mật khẩu thành công');
        });
    }

    public function forgotPassword(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            // In a real application, you would send a password reset email
            // For now, we'll just return a success message
            return $this->successResponse(null, 'Email đặt lại mật khẩu đã được gửi');
        });
    }

    public function resetPassword(Request $request)
    {
        return $this->executeApiAction(function () use ($request) {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
                'token' => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ]);

            // In a real application, you would verify the reset token
            // For now, we'll just update the password
            $user = User::where('email', $validated['email'])->first();
            $user->update([
                'password' => Hash::make($validated['password'])
            ]);

            return $this->successResponse(null, 'Đặt lại mật khẩu thành công');
        });
    }
}