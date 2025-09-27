@extends('emails.layout')

@section('content')
<tr>
    <td style="padding: 30px 40px 20px;">
        <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a365d;">Welcome {{ $user->name }} to CineBook!</h1>
        
        <p style="margin: 0 0 15px; color: #4a5568; line-height: 1.6;">
            Thank you for registering an account at CineBook. You can use the following information to log in to the system:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{{ $user->email }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: bold;">Password:</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{{ $plainPassword }}</td>
            </tr>
        </table>
        
        <p style="margin: 0 0 15px; color: #4a5568; line-height: 1.6;">
            Please log in to your account and change your password immediately to ensure account security.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/login" 
               style="display: inline-block; padding: 12px 24px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Log In Now
            </a>
        </div>
        
        <p style="margin: 0 0 15px; color: #4a5568; line-height: 1.6;">
            If you have any questions, please contact us via this email or call our hotline.
        </p>
        
        <p style="margin: 0 0 15px; color: #4a5568; line-height: 1.6;">
            Best regards,<br>
            The CineBook Team
        </p>
    </td>
</tr>
@endsection