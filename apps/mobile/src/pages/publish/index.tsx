import { Button, Input, Picker, Text, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { getClientToken } from '@/auth';
import { routes } from '@/constants/routes';
import { PageShell } from '@/features/shell/PageShell';
import { isAuthRedirectError, publishProject, type ProjectCategory } from '@/services/client-api';
import './index.scss';

export default function PublishPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<ProjectCategory, 'all'>>('ai');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!getClientToken()) {
    return (
      <PageShell title="发布项目" description="登录后就可以把你的项目想法发布出来，进入审核流程。">
        <Button onClick={() => Taro.navigateTo({ url: routes.auth })}>先去登录</Button>
      </PageShell>
    );
  }

  const categoryOptions = [
    { label: 'AI 应用', value: 'ai' },
    { label: '电商零售', value: 'ecommerce' },
    { label: '效率工具', value: 'tool' },
    { label: '内容社区', value: 'content' }
  ] as const;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const result = await publishProject({ title, category, summary, details });
      setMessage('项目已提交审核，正在跳转项目页...');
      setTimeout(() => {
        Taro.navigateTo({ url: `${routes.projectDetail}?id=${result.id}` });
      }, 600);
    } catch (submitError) {
      if (isAuthRedirectError(submitError)) {
        return;
      }

      setError(submitError instanceof Error ? submitError.message : '发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="发布项目" description="把你的项目灵感、目标用户和验证思路写下来，让更多人看到、讨论、共创。">
      <View className="mobile-publish__form">
        <Input
          className="mobile-publish__input"
          type="text"
          placeholder="比如：AI 面试陪练 / 私域活动排期器 / 创作者选题池"
          value={title}
          onInput={(event) => setTitle(event.detail.value)}
        />
        <Picker mode="selector" range={categoryOptions.map((item) => item.label)} onChange={(event) => setCategory(categoryOptions[Number(event.detail.value)].value)}>
          <View className="mobile-publish__picker">{categoryOptions.find((item) => item.value === category)?.label || '选择项目方向'}</View>
        </Picker>
        <Textarea
          className="mobile-publish__textarea"
          placeholder="用 1 到 3 句话描述你的项目要解决什么问题，适合谁使用，以及为什么值得做。"
          value={summary}
          maxlength={300}
          onInput={(event) => setSummary(event.detail.value)}
        />
        <Textarea
          className="mobile-publish__textarea mobile-publish__textarea--large"
          placeholder="写清楚你的目标用户、核心场景、竞争优势、验证方法，以及你希望获得什么样的反馈。"
          value={details}
          maxlength={2000}
          onInput={(event) => setDetails(event.detail.value)}
        />
        {error ? <Text className="mobile-publish__error">{error}</Text> : null}
        {message ? <Text className="mobile-publish__message">{message}</Text> : null}
        <Button className="mobile-publish__submit" loading={submitting} onClick={handleSubmit}>
          提交审核
        </Button>
      </View>

      <View className="mobile-publish__tips">
        <Text className="mobile-publish__tips-title">发布建议</Text>
        <Text>先写清楚目标用户是谁</Text>
        <Text>说明要解决的核心问题</Text>
        <Text>补充你设想中的变现方式</Text>
        <Text>留下希望获得的反馈方向</Text>
      </View>
    </PageShell>
  );
}
