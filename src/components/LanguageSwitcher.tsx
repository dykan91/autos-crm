import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as 'ru' | 'de';

  return (
    <Space size={4}>
      <Button
        size="small"
        type={current === 'ru' ? 'primary' : 'text'}
        style={{ color: current === 'ru' ? undefined : 'rgba(255,255,255,0.65)', minWidth: 36 }}
        onClick={() => setLanguage('ru')}
      >
        RU
      </Button>
      <Button
        size="small"
        type={current === 'de' ? 'primary' : 'text'}
        style={{ color: current === 'de' ? undefined : 'rgba(255,255,255,0.65)', minWidth: 36 }}
        onClick={() => setLanguage('de')}
      >
        DE
      </Button>
    </Space>
  );
}