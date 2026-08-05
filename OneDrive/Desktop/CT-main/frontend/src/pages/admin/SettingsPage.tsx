import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useSettings, useSettingsMutation } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

const FIELD_DEFS: Array<{ key: string; label: string; type: 'text' | 'time' | 'number' | 'email' | 'tel' }> = [
  { key: 'transportServiceName', label: 'Transport service name', type: 'text' },
  { key: 'universityName', label: 'University name', type: 'text' },
  { key: 'operatingHours', label: 'Operating hours', type: 'text' },
  { key: 'morningTripTime', label: 'Morning trip time', type: 'time' },
  { key: 'eveningTripTime', label: 'Evening trip time', type: 'time' },
  { key: 'monthlyTransportFee', label: 'Monthly transport fee (₹)', type: 'number' },
  { key: 'emergencyPhone', label: 'Emergency phone', type: 'tel' },
  { key: 'securityPhone', label: 'Security phone', type: 'tel' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
];

const BOOLEAN_KEYS = ['notificationsEnabled', 'gpsSimulationEnabled'];

export function AdminSettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSettingsMutation();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const setValue = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async () => {
    try {
      await save.mutateAsync(values);
      toast('Settings saved', { tone: 'success' });
    } catch (err: any) {
      toast('Could not save settings', { message: err?.message, tone: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Campus-wide transport configuration."
        actions={
          <Button variant="primary" onClick={submit} loading={save.isPending}>
            <Save className="h-4 w-4" /> Save settings
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
              {FIELD_DEFS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <Input type={f.type} value={values[f.key] ?? ''} onChange={(e) => setValue(f.key, e.target.value)} />
                </Field>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 pt-5">
              <p className="text-sm font-semibold">System toggles</p>
              {BOOLEAN_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{key === 'notificationsEnabled' ? 'Push notifications' : 'GPS simulation'}</p>
                    <p className="text-xs text-muted-foreground">
                      {key === 'notificationsEnabled' ? 'Send realtime alerts to users' : 'Simulate live bus movement'}
                    </p>
                  </div>
                  <Switch
                    checked={values[key] === 'true'}
                    onCheckedChange={(v) => setValue(key, String(v))}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                GPS simulation toggles the backend's autonomous bus movement engine. Disabling it freezes buses at their last position.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
