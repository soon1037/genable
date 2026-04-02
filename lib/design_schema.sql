-- SQL Schema for Genable Design

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create design_projects table
CREATE TABLE IF NOT EXISTS design_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{"pages": []}',
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create design_templates table
CREATE TABLE IF NOT EXISTS design_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE design_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

-- Add policies for design_projects
DROP POLICY IF EXISTS "Users can view their company design projects" ON design_projects;
CREATE POLICY "Users can view their company design projects" ON design_projects
    FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert design projects to their company" ON design_projects;
CREATE POLICY "Users can insert design projects to their company" ON design_projects
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company design projects" ON design_projects;
CREATE POLICY "Users can update their company design projects" ON design_projects
    FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their company design projects" ON design_projects;
CREATE POLICY "Users can delete their company design projects" ON design_projects
    FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Add policies for design_templates
DROP POLICY IF EXISTS "Users can view their company design templates" ON design_templates;
CREATE POLICY "Users can view their company design templates" ON design_templates
    FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert design templates to their company" ON design_templates;
CREATE POLICY "Users can insert design templates to their company" ON design_templates
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company design templates" ON design_templates;
CREATE POLICY "Users can update their company design templates" ON design_templates
    FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their company design templates" ON design_templates;
CREATE POLICY "Users can delete their company design templates" ON design_templates
    FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
