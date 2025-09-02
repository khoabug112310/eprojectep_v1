<?php

namespace Tests\Unit\Requests;

use Tests\TestCase;
use App\Http\Requests\SecureFileUploadRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SecureFileUploadRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        $this->regularUser = User::factory()->create(['role' => 'user']);
    }

    /** @test */
    public function admin_user_is_authorized()
    {
        $request = new SecureFileUploadRequest();
        $request->setUserResolver(function () {
            return $this->adminUser;
        });
        
        $this->assertTrue($request->authorize());
    }

    /** @test */
    public function regular_user_is_not_authorized()
    {
        $request = new SecureFileUploadRequest();
        $request->setUserResolver(function () {
            return $this->regularUser;
        });
        
        $this->assertFalse($request->authorize());
    }

    /** @test */
    public function guest_user_is_not_authorized()
    {
        $request = new SecureFileUploadRequest();
        $request->setUserResolver(function () {
            return null;
        });
        
        $this->assertFalse($request->authorize());
    }

    /** @test */
    public function validation_rules_require_poster_file()
    {
        $request = new SecureFileUploadRequest();
        $rules = $request->rules();
        
        $this->assertArrayHasKey('poster', $rules);
        $this->assertContains('required', $rules['poster']);
        $this->assertContains('file', $rules['poster']);
    }

    /** @test */
    public function validation_rules_set_correct_limits()
    {
        $request = new SecureFileUploadRequest();
        $rules = $request->rules();
        
        // Check alt_text rules
        $this->assertEquals('nullable|string|max:255', $rules['alt_text']);
        
        // Check description rules
        $this->assertEquals('nullable|string|max:1000', $rules['description']);
    }

    /** @test */
    public function validation_messages_are_in_vietnamese()
    {
        $request = new SecureFileUploadRequest();
        $messages = $request->messages();
        
        $this->assertStringContainsString('Vui lòng chọn file để upload', $messages['poster.required']);
        $this->assertStringContainsString('File phải là hình ảnh', $messages['poster.image']);
        $this->assertStringContainsString('5MB', $messages['poster.max']);
    }

    /** @test */
    public function custom_attributes_are_in_vietnamese()
    {
        $request = new SecureFileUploadRequest();
        $attributes = $request->attributes();
        
        $this->assertEquals('file poster', $attributes['poster']);
        $this->assertEquals('mô tả alt text', $attributes['alt_text']);
        $this->assertEquals('mô tả', $attributes['description']);
    }

    /** @test */
    public function additional_security_checks_reject_php_files()
    {
        $file = UploadedFile::fake()->create('malicious.php', 100);
        
        $data = ['poster' => $file];
        $rules = (new SecureFileUploadRequest())->rules();
        
        $validator = Validator::make($data, $rules);
        $request = new SecureFileUploadRequest();
        $request->merge($data);
        $request->files->set('poster', $file);
        
        $request->withValidator($validator);
        
        $this->assertTrue($validator->fails());
        $this->assertStringContainsString('Định dạng file không được hỗ trợ', implode(' ', $validator->errors()->all()));
    }

    /** @test */
    public function additional_security_checks_reject_invalid_mime_types()
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');
        
        $data = ['poster' => $file];
        $rules = (new SecureFileUploadRequest())->rules();
        
        $validator = Validator::make($data, $rules);
        $request = new SecureFileUploadRequest();
        $request->merge($data);
        $request->files->set('poster', $file);
        
        $request->withValidator($validator);
        
        $this->assertTrue($validator->fails());
        $this->assertStringContainsString('Loại file không được hỗ trợ', implode(' ', $validator->errors()->all()));
    }

    /** @test */
    public function security_checks_detect_suspicious_filenames()
    {
        // Create a temporary file with a suspicious filename
        $tempFile = tempnam(sys_get_temp_dir(), 'test_file');
        // Create a fake JPEG header
        $fakeImageContent = "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00";
        file_put_contents($tempFile, $fakeImageContent);
        
        $file = new \Illuminate\Http\UploadedFile($tempFile, '../../../malicious.jpg', 'image/jpeg', null, true);
        
        $data = ['poster' => $file];
        $rules = (new SecureFileUploadRequest())->rules();
        
        $validator = Validator::make($data, $rules);
        $request = new SecureFileUploadRequest();
        $request->merge($data);
        $request->files->set('poster', $file);
        
        $request->withValidator($validator);
        
        // The validation should fail due to various reasons including suspicious filename
        $this->assertTrue($validator->fails());
        
        unlink($tempFile);
    }

    /** @test */
    public function security_checks_detect_executable_content()
    {
        // Create a temporary file with malicious content
        $tempFile = tempnam(sys_get_temp_dir(), 'malicious');
        file_put_contents($tempFile, '<?php echo "malicious"; ?>');
        
        $file = new UploadedFile($tempFile, 'fake.jpg', 'image/jpeg', null, true);
        
        $data = ['poster' => $file];
        $rules = (new SecureFileUploadRequest())->rules();
        
        $validator = Validator::make($data, $rules);
        $request = new SecureFileUploadRequest();
        $request->merge($data);
        $request->files->set('poster', $file);
        
        $request->withValidator($validator);
        
        $this->assertTrue($validator->fails());
        $this->assertStringContainsString('File chứa nội dung nguy hiểm', implode(' ', $validator->errors()->all()));
        
        unlink($tempFile);
    }

    /** @test */
    public function security_checks_allow_safe_images()
    {
        $file = UploadedFile::fake()->image('safe.jpg', 800, 600);
        
        $data = ['poster' => $file];
        $rules = (new SecureFileUploadRequest())->rules();
        
        $validator = Validator::make($data, $rules);
        $request = new SecureFileUploadRequest();
        $request->merge($data);
        $request->files->set('poster', $file);
        
        $request->withValidator($validator);
        
        // The base validation should pass (additional security checks in service layer)
        $this->assertFalse($validator->fails());
    }

    /** @test */
    public function has_suspicious_filename_detects_php_extensions()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasSuspiciousFilename');
        $method->setAccessible(true);
        
        $this->assertTrue($method->invoke($request, 'malicious.php'));
        $this->assertTrue($method->invoke($request, 'script.asp'));
        $this->assertTrue($method->invoke($request, 'backdoor.jsp'));
        $this->assertTrue($method->invoke($request, '.htaccess'));
        $this->assertFalse($method->invoke($request, 'safe.jpg'));
    }

    /** @test */
    public function has_suspicious_filename_detects_path_traversal()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasSuspiciousFilename');
        $method->setAccessible(true);
        
        $this->assertTrue($method->invoke($request, '../../../etc/passwd'));
        $this->assertTrue($method->invoke($request, '..\\windows\\system32\\cmd.exe'));
        $this->assertTrue($method->invoke($request, '.hiddenfile'));
        $this->assertFalse($method->invoke($request, 'normal_file.jpg'));
    }

    /** @test */
    public function has_suspicious_filename_detects_special_characters()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasSuspiciousFilename');
        $method->setAccessible(true);
        
        $this->assertTrue($method->invoke($request, 'file<script>alert()</script>.jpg'));
        $this->assertTrue($method->invoke($request, 'file"quotes".jpg'));
        $this->assertTrue($method->invoke($request, 'file|pipe.jpg'));
        $this->assertTrue($method->invoke($request, "file\x00null.jpg"));
        $this->assertFalse($method->invoke($request, 'normal-file_name.jpg'));
    }

    /** @test */
    public function has_executable_content_detects_php_code()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasExecutableContent');
        $method->setAccessible(true);
        
        $tempFile = tempnam(sys_get_temp_dir(), 'php_test');
        file_put_contents($tempFile, '<?php echo "hello"; ?>');
        
        $file = new UploadedFile($tempFile, 'test.jpg', 'image/jpeg', null, true);
        
        $this->assertTrue($method->invoke($request, $file));
        
        unlink($tempFile);
    }

    /** @test */
    public function has_executable_content_detects_javascript()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasExecutableContent');
        $method->setAccessible(true);
        
        $tempFile = tempnam(sys_get_temp_dir(), 'js_test');
        file_put_contents($tempFile, '<script>alert("xss")</script>');
        
        $file = new UploadedFile($tempFile, 'test.jpg', 'image/jpeg', null, true);
        
        $this->assertTrue($method->invoke($request, $file));
        
        unlink($tempFile);
    }

    /** @test */
    public function has_executable_content_allows_safe_content()
    {
        $request = new SecureFileUploadRequest();
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('hasExecutableContent');
        $method->setAccessible(true);
        
        $tempFile = tempnam(sys_get_temp_dir(), 'safe_test');
        file_put_contents($tempFile, 'This is just normal image content');
        
        $file = new UploadedFile($tempFile, 'test.jpg', 'image/jpeg', null, true);
        
        $this->assertFalse($method->invoke($request, $file));
        
        unlink($tempFile);
    }
}