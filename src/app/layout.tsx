import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/app/providers';

export const metadata: Metadata = {
	title: 'Data Alchemist',
	description: 'AI-Powered Resource Allocation Configurator'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}


