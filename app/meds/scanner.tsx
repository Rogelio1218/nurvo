import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Try to look up barcode via OpenFDA
    try {
      const url = `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${data}"&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        const med = result.results?.[0];
        if (med) {
          const name =
            med.openfda?.brand_name?.[0] ||
            med.openfda?.generic_name?.[0] ||
            'Unknown medication';
          const genericName = med.openfda?.generic_name?.[0];
          const strength = med.openfda?.strength?.[0];

          router.replace({
            pathname: '/meds/add',
            params: {
              scannedName: name,
              scannedGeneric: genericName ?? '',
              scannedStrength: strength ?? '',
            },
          });
          return;
        }
      }
    } catch {}

    // Fallback: pass barcode data as search query
    router.replace({
      pathname: '/meds/add',
      params: { scannedName: data },
    });
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Requesting camera access...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Feather name="camera-off" size={40} color={theme.colors.textTertiary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Nurvo needs camera access to scan medication barcodes.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Enter manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'code39'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Feather name="x" size={22} color={theme.colors.surface} />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan barcode</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            {/* Corner indicators */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((style, i) => (
              <View
                key={i}
                style={[
                  styles.corner,
                  style as any,
                  { borderColor: theme.colors.surface },
                ]}
              />
            ))}
          </View>
          <Text style={styles.scanHint}>
            Point at the barcode on the medication package
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => router.replace('/meds/add')}
          >
            <Text style={styles.manualText}>Enter name manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  permissionTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
  },
  permissionButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
  backLink: {
    paddingVertical: theme.spacing.sm,
  },
  backLinkText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  viewfinderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  viewfinder: {
    width: 260,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 2,
  },
  scanHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: theme.spacing.xl,
    paddingBottom: 50,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rescanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
  },
  rescanText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  manualButton: {
    paddingVertical: theme.spacing.md,
  },
  manualText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
