export type Profile = {
    id: string;
    full_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    avatar_src: 'custom' | 'discord' | 'gravatar';
    discord_username: string | null;
    created_at?: string;
    updated_at?: string;
};

export type AccountLink = {
    id: string;
    user_id: string;
    provider: 'discord';
    provider_user_id: string;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
};
