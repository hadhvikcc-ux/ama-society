import React from 'react';
import { Redirect } from 'expo-router';

export default function CommunityIndex() {
  return <Redirect href="/(resident)/community/announcements" />;
}
