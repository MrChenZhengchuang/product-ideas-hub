package com.productideas.service.client;

import com.productideas.common.ApiException;
import com.productideas.domain.SiteUser;
import com.productideas.domain.UserProfile;
import com.productideas.domain.UserProfileStats;
import com.productideas.mapper.ProjectMapper;
import com.productideas.mapper.SiteUserMapper;
import com.productideas.security.CaptchaService;
import com.productideas.security.PasswordService;
import com.productideas.security.TokenService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientAuthService {

    private final CaptchaService captchaService;
    private final PasswordService passwordService;
    private final TokenService tokenService;
    private final SiteUserMapper siteUserMapper;
    private final ProjectMapper projectMapper;

    public ClientAuthService(
        CaptchaService captchaService,
        PasswordService passwordService,
        TokenService tokenService,
        SiteUserMapper siteUserMapper,
        ProjectMapper projectMapper
    ) {
        this.captchaService = captchaService;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.siteUserMapper = siteUserMapper;
        this.projectMapper = projectMapper;
    }

    public Map<String, Object> register(String phone, String password, String nickname, String captchaId, String captchaCode) {
        verifyCaptcha(captchaId, captchaCode);

        if (phone == null || phone.isBlank() || password == null || password.isBlank() || nickname == null || nickname.isBlank()) {
            throw new ApiException("请填写手机号、昵称和密码", 400);
        }

        if (siteUserMapper.findByPhone(phone) != null) {
            throw new ApiException("该手机号已注册", 400);
        }

        SiteUser user = new SiteUser();
        user.setNickname(nickname);
        user.setPhone(phone);
        user.setPassword(passwordService.hashPassword(password));
        user.setMemberLevel("普通会员");
        user.setStatus("正常");
        siteUserMapper.insert(user);

        SiteUser saved = siteUserMapper.findById(user.getId());
        return loginPayload(saved);
    }

    @Transactional
    public Map<String, Object> login(String phone, String password, String captchaId, String captchaCode) {
        verifyCaptcha(captchaId, captchaCode);

        if (phone == null || phone.isBlank() || password == null || password.isBlank()) {
            throw new ApiException("请输入手机号和密码", 400);
        }

        SiteUser user = siteUserMapper.findByPhone(phone);
        if (user == null || !passwordService.verifyPassword(password, user.getPassword())) {
            throw new ApiException("手机号或密码错误", 401);
        }

        if (!"正常".equals(user.getStatus())) {
            throw new ApiException("当前账号状态不可登录", 403);
        }

        return loginPayload(user);
    }

    public UserProfile getProfile(SiteUser user) {
        UserProfile profile = new UserProfile();
        profile.setId(user.getId());
        profile.setNickname(user.getNickname());
        profile.setPhone(user.getPhone());
        profile.setMemberLevel(user.getMemberLevel());
        profile.setStatus(user.getStatus());

        UserProfileStats stats = projectMapper.selectUserProjectStats(user.getId());
        if (stats == null) {
            stats = new UserProfileStats();
        }
        profile.setStats(stats);
        return profile;
    }

    @Transactional
    public void changePassword(SiteUser user, String oldPassword, String newPassword) {
        if (oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ApiException("请输入原密码和新密码", 400);
        }

        SiteUser stored = siteUserMapper.findById(user.getId());
        if (stored == null || !passwordService.verifyPassword(oldPassword, stored.getPassword())) {
            throw new ApiException("原密码错误", 400);
        }

        siteUserMapper.updatePassword(user.getId(), passwordService.hashPassword(newPassword));
    }

    public SiteUser toPublicUser(SiteUser user) {
        SiteUser publicUser = new SiteUser();
        publicUser.setId(user.getId());
        publicUser.setNickname(user.getNickname());
        publicUser.setPhone(user.getPhone());
        publicUser.setMemberLevel(user.getMemberLevel());
        publicUser.setStatus(user.getStatus());
        return publicUser;
    }

    private Map<String, Object> loginPayload(SiteUser user) {
        Map<String, Object> tokenPayload = new LinkedHashMap<>();
        tokenPayload.put("siteUserId", user.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", tokenService.signToken(tokenPayload));
        result.put("user", toPublicUser(user));
        return result;
    }

    private void verifyCaptcha(String captchaId, String captchaCode) {
        String error = captchaService.verifyAndConsume(captchaId, captchaCode);
        if (error != null) {
            throw new ApiException(error, 400);
        }
    }
}
